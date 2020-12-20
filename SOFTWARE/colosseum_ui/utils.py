def is_int(s):
    try:
        int(s)
    except ValueError:
        return False
    return True

def is_float(s):
    """
    Given a string s, returns whether s is a string-encoded float.
    """
    try:
        float(s)
    except ValueError:
        return False
    return True

def make_row_dict(setting, value, unit):
    return {
        'setting': setting,
        'value': value,
        'unit': unit,
    }

def read_angles(path):
    with open(path, 'r') as f:
        return [
            int(angle)
            for angle in f.readlines()
            if not angle.startswith('#') and not angle.isspace()
        ]

def make_commands(angles):
    return [f"<RUN,111,{angle},{angle},{angle}>" for angle in angles]

def dummy_function(*args, **kwargs):
    return
