from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField, FloatField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError, NumberRange
from models import User, Equipment # Import User and Equipment models

class RegistrationForm(FlaskForm):
    username = StringField('Username',
                           validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email',
                        validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password',
                                     validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Sign Up')

    def validate_username(self, username):
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('That username is taken. Please choose a different one.')

    def validate_email(self, email):
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('That email is taken. Please choose a different one.')

class LoginForm(FlaskForm):
    email = StringField('Email',
                        validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class AddEquipmentForm(FlaskForm):
    equipment_uid = StringField('Equipment UID', validators=[DataRequired(), Length(min=1, max=80)])
    name = StringField('Equipment Name', validators=[DataRequired(), Length(min=1, max=100)])
    submit = SubmitField('Add Equipment')

    def validate_equipment_uid(self, equipment_uid):
        equipment = Equipment.query.filter_by(equipment_uid=equipment_uid.data).first()
        if equipment:
            raise ValidationError('This Equipment UID is already registered. Please choose a different one.')

class AddGeofenceForm(FlaskForm):
    name = StringField('Geofence Name', validators=[DataRequired(), Length(min=3, max=100)])
    latitude = FloatField('Center Latitude', validators=[DataRequired(), NumberRange(min=-90.0, max=90.0)])
    longitude = FloatField('Center Longitude', validators=[DataRequired(), NumberRange(min=-180.0, max=180.0)])
    radius = FloatField('Radius (meters)', validators=[DataRequired(), NumberRange(min=10.0, max=10000.0)]) # Min 10m, Max 10km
    submit = SubmitField('Add Geofence')
