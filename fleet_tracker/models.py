from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app import db # Import db from the main app file
from datetime import datetime # Import datetime for timestamp

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False) # Increased length for stronger hashes
    equipments = db.relationship('Equipment', backref='owner', lazy=True)
    geofences = db.relationship('Geofence', backref='owner', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Equipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    equipment_uid = db.Column(db.String(80), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, index=True, default=datetime.utcnow) # Creation timestamp
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    last_seen = db.Column(db.DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)
    location_history = db.relationship('LocationHistory', backref='equipment_item', lazy='dynamic', order_by='LocationHistory.timestamp')
    geofence_events = db.relationship('GeofenceEvent', backref='equipment_item', lazy='dynamic')


    def __repr__(self):
        return f'<Equipment {self.equipment_uid} ({self.name}) [{self.latitude},{self.longitude}] LastSeen: {self.last_seen}>'

class Geofence(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    latitude = db.Column(db.Float, nullable=False) # Center latitude
    longitude = db.Column(db.Float, nullable=False) # Center longitude
    radius = db.Column(db.Float, nullable=False) # Radius in meters
    geofence_events = db.relationship('GeofenceEvent', backref='geofence_item', lazy='dynamic', cascade="all, delete-orphan")


    def __repr__(self):
        return f'<Geofence {self.name} (User {self.user_id}) Center=({self.latitude},{self.longitude}) R={self.radius}m>'

class GeofenceEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    geofence_id = db.Column(db.Integer, db.ForeignKey('geofence.id'), nullable=False)
    status = db.Column(db.String(10), nullable=False)  # "entered" or "exited"
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<GeofenceEvent EqID {self.equipment_id} GeofenceID {self.geofence_id} Status {self.status} @ {self.timestamp}>'

class LocationHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    def __repr__(self):
        return f'<LocationHistory {self.id} for EqID {self.equipment_id} @ {self.timestamp}>'
