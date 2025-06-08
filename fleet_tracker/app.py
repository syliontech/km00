import os
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your_secret_key') # Replace with a strong secret key
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///fleet_tracker.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['GOOGLE_MAPS_API_KEY'] = os.environ.get('GOOGLE_MAPS_API_KEY')
app.config['DEVICE_API_KEY'] = os.environ.get('DEVICE_API_KEY', 'default_device_secret_key')

db = SQLAlchemy(app)
migrate = Migrate(app, db)
login_manager = LoginManager(app)
login_manager.login_view = 'login' # The view function name for the login page
login_manager.login_message_category = 'info' # Flash message category for login_required

# Models and forms will be imported here later to avoid circular imports
from models import User, Equipment, LocationHistory, Geofence, GeofenceEvent
from forms import RegistrationForm, LoginForm, AddEquipmentForm, AddGeofenceForm
from .utils import is_inside_geofence # Import geofence utility

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created! You are now able to log in', 'success')
        login_user(user)
        return redirect(url_for('dashboard'))
    return render_template('register.html', title='Register', form=form)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            flash('Login Successful!', 'success')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Login Unsuccessful. Please check email and password', 'danger')
    return render_template('login.html', title='Login', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    user_equipment = Equipment.query.filter_by(user_id=current_user.id).all()
    # Fetch recent geofence events for the user's equipment
    # This query joins GeofenceEvent with Equipment to filter by user_id
    recent_geofence_events = GeofenceEvent.query.join(Equipment).filter(Equipment.user_id == current_user.id).order_by(GeofenceEvent.timestamp.desc()).limit(10).all()
    return render_template('dashboard.html', title='Dashboard', equipment_list=user_equipment, geofence_events=recent_geofence_events)

@app.route('/add_equipment', methods=['GET', 'POST'])
@login_required
def add_equipment():
    form = AddEquipmentForm()
    if form.validate_on_submit():
        equipment = Equipment(equipment_uid=form.equipment_uid.data,
                              name=form.name.data,
                              owner=current_user) # or user_id=current_user.id
        db.session.add(equipment)
        db.session.commit()
        flash('New equipment has been added successfully!', 'success')
        return redirect(url_for('dashboard'))
    return render_template('add_equipment.html', title='Add Equipment', form=form)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.context_processor
def inject_google_maps_api_key():
    return dict(google_maps_api_key=app.config['GOOGLE_MAPS_API_KEY'])

# Need to import request for the 'next' page functionality in login
from datetime import datetime # For last_seen timestamp

# from flask import request # Already imported

@app.route('/api/update_location', methods=['POST'])
def update_location():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON payload"}), 400

    required_fields = ["equipment_uid", "latitude", "longitude", "api_key"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing fields in payload"}), 400

    if data['api_key'] != app.config['DEVICE_API_KEY']:
        return jsonify({"error": "Invalid device API key"}), 403

    equipment = Equipment.query.filter_by(equipment_uid=data['equipment_uid']).first()
    if not equipment:
        return jsonify({"error": "Equipment not found"}), 404

    try:
        equipment.latitude = float(data['latitude'])
        equipment.longitude = float(data['longitude'])
        equipment.last_seen = datetime.utcnow()

        new_history_record = LocationHistory(
            equipment_id=equipment.id, # Corrected: using equipment_id as per model
            latitude=data['latitude'],
            longitude=data['longitude'],
            timestamp=datetime.utcnow() # Using the same timestamp for consistency here, or equipment.last_seen
        )
        db.session.add(new_history_record)
        # db.session.commit() # Commit later after geofence events

        # Geofence Checking Logic
        # Equipment object is already fetched as 'equipment'
        if equipment.owner: # Check if equipment has an owner
            user_geofences = Geofence.query.filter_by(user_id=equipment.owner.id).all()
            new_events_to_add = []

            for geofence_item in user_geofences: # Renamed to avoid conflict
                currently_inside = is_inside_geofence(new_history_record.latitude, new_history_record.longitude, geofence_item)

                last_event = GeofenceEvent.query.filter_by(
                    equipment_id=equipment.id,
                    geofence_id=geofence_item.id
                ).order_by(GeofenceEvent.timestamp.desc()).first()

                last_status_was_inside = last_event and last_event.status == "entered"

                if currently_inside and not last_status_was_inside:
                    new_event = GeofenceEvent(
                        equipment_id=equipment.id,
                        geofence_id=geofence_item.id,
                        status="entered",
                        timestamp=new_history_record.timestamp # Use history record's timestamp
                    )
                    new_events_to_add.append(new_event)
                elif not currently_inside and last_status_was_inside:
                    new_event = GeofenceEvent(
                        equipment_id=equipment.id,
                        geofence_id=geofence_item.id,
                        status="exited",
                        timestamp=new_history_record.timestamp # Use history record's timestamp
                    )
                    new_events_to_add.append(new_event)

            if new_events_to_add:
                db.session.add_all(new_events_to_add)

        db.session.commit() # Commit equipment update, history, and geofence events together
        return jsonify({"success": True, "message": "Location updated successfully"}), 200
    except ValueError:
        return jsonify({"error": "Invalid latitude or longitude format"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_equipment_locations', methods=['GET'])
@login_required
def get_equipment_locations():
    equipment_list = Equipment.query.filter(
        Equipment.user_id == current_user.id,
        Equipment.latitude.isnot(None),
        Equipment.longitude.isnot(None)
    ).all()

    locations = []
    for eq in equipment_list:
        locations.append({
            "uid": eq.equipment_uid,
            "name": eq.name,
            "lat": eq.latitude,
            "lng": eq.longitude,
            "last_seen": eq.last_seen.isoformat() if eq.last_seen else None
        })
    return jsonify(locations)

@app.route('/map')
@login_required
def map_view():
    user_equipment = Equipment.query.filter_by(user_id=current_user.id).order_by(Equipment.name).all()
    return render_template('map.html', title='Live Map', equipments_list=user_equipment)

@app.route('/api/get_equipment_history/<string:equipment_uid>', methods=['GET'])
@login_required
def get_equipment_history(equipment_uid):
    equipment = Equipment.query.filter_by(equipment_uid=equipment_uid, user_id=current_user.id).first_or_404()

    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    query = equipment.location_history # This is LocationHistory.query.filter_by(equipment_id=equipment.id) due to lazy='dynamic'

    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%dT%H:%M:%S')
            query = query.filter(LocationHistory.timestamp >= start_date)
        except ValueError:
            return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DDTHH:MM:SS"}), 400

    if end_date_str:
        try:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%dT%H:%M:%S')
            query = query.filter(LocationHistory.timestamp <= end_date)
        except ValueError:
            return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DDTHH:MM:SS"}), 400

    history_records = query.order_by(LocationHistory.timestamp.asc()).all()

    history_data = [{
        "lat": r.latitude,
        "lng": r.longitude,
        "timestamp": r.timestamp.isoformat()
    } for r in history_records]

    return jsonify(history_data)

@app.route('/geofences', methods=['GET', 'POST'])
@login_required
def geofences_route(): # Renamed to avoid conflict with model name
    form = AddGeofenceForm()
    if form.validate_on_submit():
        geofence = Geofence(name=form.name.data,
                            latitude=form.latitude.data,
                            longitude=form.longitude.data,
                            radius=form.radius.data,
                            owner=current_user)
        db.session.add(geofence)
        db.session.commit()
        flash('Geofence added successfully!', 'success')
        return redirect(url_for('geofences_route'))

    user_geofences = Geofence.query.filter_by(user_id=current_user.id).order_by(Geofence.name).all()
    return render_template('geofences.html', title='Manage Geofences', form=form, geofences_list=user_geofences)

@app.route('/delete_geofence/<int:geofence_id>', methods=['POST'])
@login_required
def delete_geofence(geofence_id):
    geofence = Geofence.query.get_or_404(geofence_id)
    if geofence.owner != current_user:
        flash('Not authorized to delete this geofence.', 'danger')
        return redirect(url_for('geofences_route'))

    # GeofenceEvent records are deleted via cascade="all, delete-orphan" on the relationship in Geofence model
    # No need to manually delete GeofenceEvent records here if cascade is set up correctly.
    # If cascade wasn't set, you would do:
    # GeofenceEvent.query.filter_by(geofence_id=geofence.id).delete()

    db.session.delete(geofence)
    db.session.commit()
    flash('Geofence and associated events deleted successfully.', 'success')
    return redirect(url_for('geofences_route'))

@app.route('/api/get_geofences', methods=['GET'])
@login_required
def get_geofences_api(): # Renamed to avoid conflict with model name or other routes
    user_geofences = Geofence.query.filter_by(user_id=current_user.id).all()
    geofences_data = [{
        "id": g.id,
        "name": g.name,
        "lat": g.latitude,
        "lng": g.longitude,
        "radius": g.radius
    } for g in user_geofences]
    return jsonify(geofences_data)

if __name__ == '__main__':
    # Initialize database if it doesn't exist
    # This is a simplified approach for development.
    # For production, use Flask-Migrate commands.
    with app.app_context():
        db.create_all()
    app.run(debug=True)
