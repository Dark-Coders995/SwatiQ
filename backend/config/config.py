import os

curr_dir = os.path.abspath(os.path.dirname(__file__))


class Config:
    DEBUG = False
    SQLITE_DB_DIR = None
    SQLALCHEMY_DATABASE_URI = None
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class LocalDevelopmentConfig(Config):
    SQLITE_DB_DIR = os.path.join(curr_dir, '../database')
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(SQLITE_DB_DIR, 'housing.db')
    DEBUG = True
    SECRET_KEY = "InternShip14ty"  # strong unique random key
    SECURITY_PASSWORD_HASH = 'bcrypt'
    SECURITY_PASSWORD_SALT = 'InternShip14ty6785'  # Strong unique key