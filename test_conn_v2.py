import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres:Yeferson9610@127.0.0.1:5432/facturacion_db")
    print("Conexión exitosa con postgres")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
