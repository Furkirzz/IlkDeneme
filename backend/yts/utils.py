from datetime import datetime, timedelta, time

def generate_time_choices(interval_minutes=30):
    times = []
    current = datetime.strptime("00:00", "%H:%M")
    end = datetime.strptime("23:30", "%H:%M")
    while current <= end:
        t = current.time()
        times.append((t, t.strftime("%H:%M")))
        current += timedelta(minutes=interval_minutes)
    return times

