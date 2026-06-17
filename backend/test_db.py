from database import engine

try:

    conn = engine.connect()

    print(
        "DB 연결 성공"
    )

    conn.close()

except Exception as e:

    print(e)