
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
