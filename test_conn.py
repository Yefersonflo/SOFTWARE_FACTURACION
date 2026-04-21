import psycopg2
try:
    conn = psycopg2.connect(
        dbname="facturacion_db",
        user="Yeferson",
        password="Yeferson9610",
        host="localhost",
        port="5432"
    )
    print("Conexión exitosa")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
