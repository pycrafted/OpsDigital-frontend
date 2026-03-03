#script 

import pyodbc

SERVER = "SAR-IP21-V12"
TAG = "30LI008"
CONN_STRING = f"DRIVER={{AspenTech SQLplus}};HOST={SERVER}"

conn = pyodbc.connect(CONN_STRING)
cursor = conn.cursor()

print("=== Noms des colonnes HISTORY ===")
cursor.execute(f"SELECT * FROM HISTORY WHERE NAME = '{TAG}'")
cols = [desc[0] for desc in cursor.description]
print(cols)
row = cursor.fetchone()
for i, (col, val) in enumerate(zip(cols, row)):
    print(f"  col[{i}] {col} = {val}")

print("\n=== Métadonnées du tag ===")
meta_fields = [
    "IP_DESCRIPTION",
    "IP_ENG_UNITS", 
    "IP_HIGH_LIMIT",
    "IP_LOW_LIMIT",
    "IP_INPUT_VALUE",
    "IP_INPUT_TIME",
    "IP_TREND_VALUE",
]
for field in meta_fields:
    try:
        cursor.execute(f'SELECT {field} FROM "{TAG}"')
        val = cursor.fetchone()
        print(f"✅ {field} = {val[0] if val else None}")
    except Exception as e:
        print(f"❌ {field} → {e}")

print("\n=== Liste des tags disponibles ===")
try:
    cursor.execute("SELECT NAME, IP_DESCRIPTION FROM ATCAI")
    rows = cursor.fetchmany(20)
    for r in rows:
        print(f"  {r}")
except Exception as e:
    print(f"❌ ATCAI → {e}")

conn.close()


#linkage


🎉 On a TOUT ce qu'il faut !
Les métadonnées sont complètes et les colonnes HISTORY sont identifiées. Le seul problème restant est l'encodage pour lister les tags — facile à régler.

Résumé de ce qu'on sait maintenant
HISTORY columns:
  NAME      → nom du tag
  TS        → timestamp
  VALUE     → valeur mesurée  ← col[6]
  STATUS    → qualité (0 = bon)
  PERIOD    → période d'échantillonnage (600s = 10min)

Métadonnées tag 30LI008:
  Description  → "EAU DOUCE T341"
  Unité        → "M" (mètres)
  Valeur actuelle → 8.38 M

Régler le problème d'encodage pour lister les tags
pythonimport pyodbc

SERVER = "SAR-IP21-V12"
CONN_STRING = f"DRIVER={{AspenTech SQLplus}};HOST={SERVER};encoding=latin-1"

# Si ça ne marche pas dans la conn string, on force après connexion
conn = pyodbc.connect(CONN_STRING)
conn.setdecoding(pyodbc.SQL_CHAR, encoding='latin-1')
conn.setdecoding(pyodbc.SQL_WCHAR, encoding='latin-1')
conn.setencoding(encoding='latin-1')

cursor = conn.cursor()

print("=== Liste des tags ATCAI ===")
try:
    cursor.execute("SELECT NAME, IP_DESCRIPTION, IP_ENG_UNITS FROM ATCAI")
    rows = cursor.fetchmany(30)
    for r in rows:
        print(f"  {r}")
except Exception as e:
    print(f"❌ {e}")

conn.close()

✅ On a tout pour construire — Voici le linkage complet
python# ip21_connector.py — Module final prêt pour Django

import pyodbc
from datetime import datetime

SERVER = "SAR-IP21-V12"
CONN_STRING = f"DRIVER={{AspenTech SQLplus}};HOST={SERVER}"

def get_connection():
    conn = pyodbc.connect(CONN_STRING)
    conn.setdecoding(pyodbc.SQL_CHAR, encoding='latin-1')
    conn.setdecoding(pyodbc.SQL_WCHAR, encoding='latin-1')
    conn.setencoding(encoding='latin-1')
    return conn

def get_current_value(tag: str) -> dict:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT IP_INPUT_VALUE, IP_INPUT_TIME, 
                   IP_DESCRIPTION, IP_ENG_UNITS
            FROM "{tag}"
        """)
        row = cursor.fetchone()
        return {
            "tag": tag,
            "value": round(row[0], 4) if row[0] else None,
            "timestamp": row[1],
            "description": row[2],
            "unit": row[3],
        }

def get_history(tag: str, start: str, end: str) -> list:
    """
    start/end format: '25-FEB-26 10:00:00'
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT NAME, TS, VALUE, STATUS
            FROM HISTORY 
            WHERE NAME = '{tag}'
            AND TS >= '{start}'
            AND TS <= '{end}'
            ORDER BY TS
        """)
        rows = cursor.fetchall()
        return [
            {
                "tag": row[0],
                "timestamp": row[1],
                "value": round(row[2], 4) if row[2] else None,
                "status": row[3],
            }
            for row in rows
        ]

def get_all_tags() -> list:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT NAME, IP_DESCRIPTION, IP_ENG_UNITS FROM ATCAI")
        rows = cursor.fetchall()
        return [
            {
                "tag": row[0],
                "description": row[1],
                "unit": row[2],
            }
            for row in rows
        ]

On est prêts à attaquer Django. Tu veux qu'on commence par la structure du projet ou directement les endpoints API ?
