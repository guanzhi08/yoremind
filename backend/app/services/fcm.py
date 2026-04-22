import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_fcm_app = None


def _get_app():
    global _fcm_app
    if _fcm_app is not None:
        return _fcm_app

    from app.core.config import settings
    if not settings.FIREBASE_CREDENTIALS_JSON:
        logger.warning("FIREBASE_CREDENTIALS_JSON not set; FCM notifications disabled")
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
        cred = credentials.Certificate(cred_dict)
        _fcm_app = firebase_admin.initialize_app(cred)
    except Exception as exc:
        logger.error("Failed to initialize Firebase: %s", exc)
        return None

    return _fcm_app


def send_notification(fcm_token: str, title: str, body: str, data: Optional[dict] = None) -> bool:
    app = _get_app()
    if app is None:
        logger.info("FCM disabled — would send: [%s] %s", title, body)
        return False

    try:
        from firebase_admin import messaging
        message = messaging.Message(
            notification=messaging.Notification(title=title, body=body),
            data=data or {},
            token=fcm_token,
        )
        messaging.send(message)
        return True
    except Exception as exc:
        logger.error("FCM send failed: %s", exc)
        return False
