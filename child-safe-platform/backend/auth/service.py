from datetime import datetime
from backend.database.mongodb import get_database
from backend.auth.security import hash_password, verify_password
from backend.utils.helpers import generate_uuid, format_timestamp, format_user

def register_user(name: str, email: str, password: str, role: str) -> dict:
    db = get_database()
    existing = db.users.find_one({'email': email})
    if existing:
        return None
    user_id = generate_uuid()
    user_doc = {
        '_id': user_id,
        'name': name,
        'email': email,
        'password_hash': hash_password(password),
        'role': role,
        'avatar': None,
        'created_at': datetime.utcnow(),
        'last_active': datetime.utcnow(),
        'status': 'offline'
    }
    db.users.insert_one(user_doc)

    # Auto-connect new CONTACT friends to the child
    if role == 'CONTACT':
        child = db.users.find_one({'role': 'CHILD'})
        if child:
            from backend.conversations.service import create_conversation
            conv = create_conversation(child['_id'], user_id)
            # Initialize behaviour profile
            now_iso = datetime.utcnow().isoformat()
            db.behaviour_profiles.update_one(
                {'conversation_id': conv['conversation_id']},
                {'$setOnInsert': {
                    'conversation_id': conv['conversation_id'],
                    'child_id': child['_id'],
                    'contact_id': user_id,
                    'risk_history': [{'score': 0, 'timestamp': now_iso}],
                    'average_risk': 0.0,
                    'trend': 'stable',
                    'category_frequency': {'SAFE': 1},
                    'last_updated': datetime.utcnow()
                }},
                upsert=True
            )
            # Create an initial welcome message so the chat is live and ready
            welcome_msg = {
                'message_id': f"MSG{generate_uuid()[:8].upper()}",
                'conversation_id': conv['conversation_id'],
                'sender_id': user_id,
                'receiver_id': child['_id'],
                'content': f"Hey! I just joined as a new friend.",
                'timestamp': datetime.utcnow(),
                'message_type': 'text',
                'delivery_status': 'delivered'
            }
            db.messages.insert_one(welcome_msg)
            db.conversations.update_one(
                {'conversation_id': conv['conversation_id']},
                {'$set': {'last_message_at': datetime.utcnow(), 'updated_at': datetime.utcnow()}}
            )
    elif role == 'PARENT':
        # Auto-link new parent to the primary child
        child = db.users.find_one({'role': 'CHILD'})
        if child:
            db.parent_child_links.update_one(
                {'parent_id': user_id},
                {'$set': {'parent_id': user_id, 'child_id': child['_id']}},
                upsert=True
            )
    elif role == 'CHILD':
        # Auto-link new child to the primary parent
        parent = db.users.find_one({'role': 'PARENT'})
        if parent:
            db.parent_child_links.update_one(
                {'child_id': user_id},
                {'$set': {'parent_id': parent['_id'], 'child_id': user_id}},
                upsert=True
            )

    from backend.database.mongodb import save_mock_db
    save_mock_db()

    return format_user(user_doc)

def authenticate_user(email: str, password: str) -> dict:
    db = get_database()
    user = db.users.find_one({'email': email})
    if not user:
        return None
    if not verify_password(password, user['password_hash']):
        return None
    return format_user(user)

def get_user_by_id(user_id: str) -> dict:
    db = get_database()
    user = db.users.find_one({'_id': user_id})
    return format_user(user)

def get_user_by_email(email: str) -> dict:
    db = get_database()
    user = db.users.find_one({'email': email})
    return format_user(user)

def update_user_status(user_id: str, status: str):
    db = get_database()
    db.users.update_one({'_id': user_id}, {'$set': {'status': status, 'last_active': datetime.utcnow()}})

def create_audit_log(user_id: str, action: str, details: str = ''):
    db = get_database()
    db.audit_logs.insert_one({
        'user_id': user_id,
        'action': action,
        'details': details,
        'timestamp': datetime.utcnow()
    })
