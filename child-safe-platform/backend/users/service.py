from backend.database.mongodb import get_database
from backend.utils.helpers import format_user

def get_user_contacts(user_id: str, user_role: str) -> list:
    db = get_database()
    if user_role == 'CHILD':
        # Retrieve all approved CONTACT users
        contact_users = list(db.users.find({'role': 'CONTACT'}))
        for cu in contact_users:
            if not db.conversations.find_one({'participants': {'$all': [user_id, cu['_id']]}}):
                from backend.conversations.service import create_conversation
                create_conversation(user_id, cu['_id'])
        return [format_user(u) for u in contact_users]
    elif user_role == 'CONTACT':
        # Return the child user(s)
        child_users = list(db.users.find({'role': 'CHILD'}))
        for ch in child_users:
            if not db.conversations.find_one({'participants': {'$all': [user_id, ch['_id']]}}):
                from backend.conversations.service import create_conversation
                create_conversation(ch['_id'], user_id)
        return [format_user(u) for u in child_users]
    return []

def get_user_profile(user_id: str) -> dict:
    db = get_database()
    user = db.users.find_one({'_id': user_id})
    return format_user(user)
