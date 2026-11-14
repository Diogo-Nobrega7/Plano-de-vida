"""Formatação de números no jeito brasileiro."""


def brl(valor: float, casas: int = 0) -> str:
    """1234567.8 -> 'R$ 1.234.568'"""
    texto = f"{valor:,.{casas}f}"
    texto = texto.replace(",", "_").replace(".", ",").replace("_", ".")
    return f"R$ {texto}"


def brl_curto(valor: float) -> str:
    """15000000 -> 'R$ 15 mi'; 820000 -> 'R$ 820 mil'"""
    if abs(valor) >= 1_000_000:
        return f"R$ {valor / 1_000_000:.1f} mi".replace(".", ",").replace(",0 mi", " mi")
    if abs(valor) >= 1_000:
        return f"R$ {valor / 1_000:.0f} mil"
    return brl(valor)


def pct(taxa: float) -> str:
    """0.045 -> '4,5%'; 0.1375 -> '13,75%'"""
    texto = f"{taxa * 100:.2f}".rstrip("0").rstrip(".")
    return texto.replace(".", ",") + "%"
