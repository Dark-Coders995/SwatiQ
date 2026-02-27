
from flask import Flask 
import os
from config.config import LocalDevelopmentConfig
from models.database import db

def create_app(): 
    app_create = Flask(__name__)
    if os.getenv('ENV', "development") == "production":
        raise Exception("Currently no production config is setup.")
    else:
        print("Staring Local Development")
        app_create.config.from_object(LocalDevelopmentConfig)
    db.init_app(app_create)
    app_create.app_context().push()
    return app_create

app = create_app()

if __name__ == '__main__':
    app.run()