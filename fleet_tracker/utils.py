import math

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance in meters between two points
    on the earth (specified in decimal degrees).
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # Radius of earth in meters.
    R = 6371000
    distance = R * c
    return distance

def is_inside_geofence(eq_lat, eq_lon, geofence_obj):
    """
    Check if an equipment's location is inside a given geofence.
    geofence_obj is an instance of the Geofence model.
    """
    if eq_lat is None or eq_lon is None:
        return False # Cannot determine if location is not set

    distance = haversine(eq_lat, eq_lon, geofence_obj.latitude, geofence_obj.longitude)
    return distance <= geofence_obj.radius
