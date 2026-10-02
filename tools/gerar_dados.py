"""
Regenera o arquivo clientes.json a partir da planilha de comodatos.

Uso:
    python3 gerar_dados.py CAMINHO_DA_PLANILHA.xlsx

Isso gera um novo "clientes.json" na pasta raiz do app (um nível acima),
substituindo o antigo. Depois é só re-publicar/atualizar o repositório no GitHub.

Requer: pandas, openpyxl  (pip install pandas openpyxl)
"""
import sys
import json
import os
import pandas as pd


def main():
    if len(sys.argv) < 2:
        print("Uso: python3 gerar_dados.py CAMINHO_DA_PLANILHA.xlsx")
        sys.exit(1)

    caminho = sys.argv[1]
    df = pd.read_excel(caminho)
    df["Data Emp"] = pd.to_datetime(df["Data Emp"]).dt.strftime("%Y-%m-%d")
    tem_patrimonio = "Nº Patrimônio" in df.columns

    clientes = {}
    puladas = 0
    for _, r in df.iterrows():
        if pd.isna(r["Cód Prod"]) or pd.isna(r["Descrição Produto"]):
            puladas += 1
            continue
        cod = r["Cód"]
        if cod not in clientes:
            clientes[cod] = {
                "cod": cod,
                "razao": r["Razão"],
                "fantasia": r["Fantasia"],
                "cidade": r["Cidade"],
                "vend": int(r["Vend"]),
                "itens": [],
            }
        patrimonio = None
        if tem_patrimonio and pd.notna(r["Nº Patrimônio"]):
            patrimonio = int(r["Nº Patrimônio"])
        clientes[cod]["itens"].append({
            "cev": int(r["CEV"]),
            "prodCod": int(r["Cód Prod"]),
            "prod": r["Descrição Produto"],
            "data": r["Data Emp"],
            "qtd": int(r["Qtd"]),
            "patrimonio": patrimonio,
        })

    if puladas:
        print(f"Aviso: {puladas} linha(s) sem código/descrição de produto foram ignoradas.")

    dados = list(clientes.values())

    saida = os.path.join(os.path.dirname(__file__), "..", "clientes.json")
    with open(saida, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, separators=(",", ":"))

    print(f"OK: {len(dados)} clientes gravados em {os.path.abspath(saida)}")


if __name__ == "__main__":
    main()
