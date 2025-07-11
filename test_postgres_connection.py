# -*- coding: utf-8 -*-
"""
PostgreSQL connection test script
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.sql import text

def test_connection():
    """Test PostgreSQL connection"""
    print(">>> Testing PostgreSQL connection...")

    # Load environment variables
    load_dotenv(encoding='utf-8')

    # Build connection URL
    db_user = os.getenv('DB_USER', 'project_user')
    db_password = os.getenv('DB_PASSWORD', 'secure_password')
    db_host = os.getenv('DB_HOST', 'localhost')
    db_port = os.getenv('DB_PORT', '5432')
    db_name = os.getenv('DB_NAME', 'project_test')

    db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    try:
        # Create connection
        engine = create_engine(db_url)

        # Test connection with a simple query
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();")).scalar()
            print("[OK] Connection successful!")
            print(f"PostgreSQL version: {result}")

            # Test permissions
            print("\n>>> Testing permissions...")
            conn.execute(text("CREATE TABLE IF NOT EXISTS test_table (id serial PRIMARY KEY);"))
            print("[OK] CREATE TABLE")

            conn.execute(text("INSERT INTO test_table DEFAULT VALUES;"))
            print("[OK] INSERT")

            conn.execute(text("SELECT * FROM test_table;"))
            print("[OK] SELECT")

            conn.execute(text("DROP TABLE test_table;"))
            print("[OK] DROP TABLE")

        print("\n>>> All tests passed!")
        return True

    except Exception as e:
        print(f"\n[ERROR] Connection failed: {str(e)}")
        return False

if __name__ == '__main__':
    test_connection()
