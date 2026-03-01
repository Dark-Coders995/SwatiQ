
from flask import Flask , jsonify
from flask_cors import CORS
import os
from config.config import LocalDevelopmentConfig
from models.database import db
from routes.dashboardAPI  import dashboard
from routes.inventoryAPI import inventory
from werkzeug.exceptions import HTTPException
from sqlalchemy import text
from database.seedDatabase import seed_database

def create_app(): 
    app_create = Flask(__name__)
    if os.getenv('ENV', "development") == "production":
        raise Exception("Currently no production config is setup.")
    else:
        print("Staring Local Development")
        app_create.config.from_object(LocalDevelopmentConfig)
        CORS(app_create, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE"]}})
    db.init_app(app_create)

    with app_create.app_context():
        db.create_all()
        cols = [r[1] for r in db.session.execute(text("PRAGMA table_info(medicines)")).all()]
        if "status_override" not in cols:
            db.session.execute(
                text("ALTER TABLE medicines ADD COLUMN status_override VARCHAR(50)")
            )
            db.session.commit()
        seed_database()

    app_create.app_context().push()


    return app_create

app = create_app()

app.register_blueprint(dashboard)
app.register_blueprint(inventory)


@app.errorhandler(404)
def handle_404(err):
        return (
            jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {"code": "not_found", "message": "Resource not found."},
                }
            ),
            404,
        )

@app.errorhandler(HTTPException)
def handle_http_exception(err: HTTPException):
        return (
            jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "http_exception",
                        "message": err.description or "Request failed.",
                        "details": {"status": err.code, "name": err.name},
                    },
                }
            ),
            err.code or 500,
        )

@app.errorhandler(422)
def handle_422(err):
        return (
            jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "unprocessable_entity",
                        "message": "Request could not be processed.",
                    },
                }
            ),
            422,
        )

@app.errorhandler(500)
def handle_500(err):
        return (
            jsonify(
                {
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "server_error",
                        "message": "An unexpected error occurred.",
                    },
                }
            ),
            500,
        )

if __name__ == '__main__':
    app.run(debug = True)