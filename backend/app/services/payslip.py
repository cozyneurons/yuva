"""Salary-slip PDF generation (Nihaal — Backend Support).

Pure rendering logic with no FastAPI / SQLAlchemy dependency, so it can be unit
tested in isolation. Uses reportlab (listed in requirements.txt).

Amounts are printed with an ASCII "Rs." prefix rather than the ₹ glyph, because
reportlab's built-in Helvetica font does not include U+20B9.
"""
import io
from datetime import date, datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BRAND = colors.HexColor("#6c63ff")   # matches the frontend accent
INK = colors.HexColor("#1f2937")
MUTED = colors.HexColor("#6b7280")
LINE = colors.HexColor("#e5e7eb")
SHADE = colors.HexColor("#f3f4f6")


def _month_label(period: str) -> str:
    try:
        return datetime.strptime(period, "%Y-%m").strftime("%B %Y")
    except (ValueError, TypeError):
        return period


def _inr(amount: float) -> str:
    return f"Rs. {float(amount):,.2f}"


def build_payslip_pdf(
    *,
    employee_code: str,
    full_name: str,
    period: str,
    basic: float,
    hra: float,
    allowances: float,
    deductions: float,
    net_salary: float,
    job_details: str | None = None,
) -> bytes:
    """Render a one-page salary slip and return the PDF as bytes."""
    gross = basic + hra + allowances
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        title=f"Salary Slip {period}",
        author="Dayflow HRMS",
    )

    styles = getSampleStyleSheet()
    brand = ParagraphStyle("brand", parent=styles["Title"], textColor=BRAND, fontSize=20, spaceAfter=0)
    doc_title = ParagraphStyle("doct", parent=styles["Normal"], fontSize=11, textColor=MUTED, alignment=2)
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8.5, textColor=MUTED)

    elements: list = []

    # ── Header: brand (left) + document title (right) ──────────────────────
    header = Table(
        [[
            Paragraph("Dayflow HRMS", brand),
            Paragraph(f"SALARY SLIP<br/><font size=9>{_month_label(period)}</font>", doc_title),
        ]],
        colWidths=[None, 60 * mm],
    )
    header.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW", (0, 0), (-1, -1), 1, BRAND),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements += [header, Spacer(1, 10 * mm)]

    # ── Employee details ───────────────────────────────────────────────────
    details = Table(
        [
            ["Employee Name", full_name, "Employee Code", employee_code],
            ["Pay Period", _month_label(period), "Designation", job_details or "—"],
        ],
        colWidths=[32 * mm, None, 32 * mm, 40 * mm],
    )
    details.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
        ("TEXTCOLOR", (2, 0), (2, -1), MUTED),
        ("TEXTCOLOR", (1, 0), (1, -1), INK),
        ("TEXTCOLOR", (3, 0), (3, -1), INK),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("FONTNAME", (3, 0), (3, -1), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements += [details, Spacer(1, 8 * mm)]

    # ── Earnings / deductions / net ──────────────────────────────────────────
    rows = [
        ["EARNINGS", ""],
        ["Basic Salary", _inr(basic)],
        ["House Rent Allowance (HRA)", _inr(hra)],
        ["Other Allowances", _inr(allowances)],
        ["Gross Earnings", _inr(gross)],
        ["DEDUCTIONS", ""],
        ["Total Deductions", _inr(deductions)],
        ["NET PAY", _inr(net_salary)],
    ]
    table = Table(rows, colWidths=[None, 45 * mm])
    table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (-1, -1), INK),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 1), (-1, 3), 0.5, LINE),
        # section headers (rows 0 and 5)
        ("BACKGROUND", (0, 0), (-1, 0), SHADE),
        ("BACKGROUND", (0, 5), (-1, 5), SHADE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 5), (-1, 5), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (-1, 0), MUTED),
        ("TEXTCOLOR", (0, 5), (-1, 5), MUTED),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("FONTSIZE", (0, 5), (-1, 5), 8.5),
        # gross earnings subtotal (row 4)
        ("FONTNAME", (0, 4), (-1, 4), "Helvetica-Bold"),
        ("LINEABOVE", (0, 4), (-1, 4), 0.5, LINE),
        # net pay (row 7) — brand highlight
        ("BACKGROUND", (0, 7), (-1, 7), BRAND),
        ("TEXTCOLOR", (0, 7), (-1, 7), colors.white),
        ("FONTNAME", (0, 7), (-1, 7), "Helvetica-Bold"),
        ("FONTSIZE", (0, 7), (-1, 7), 12),
        ("TOPPADDING", (0, 7), (-1, 7), 9),
        ("BOTTOMPADDING", (0, 7), (-1, 7), 9),
    ]))
    elements += [table, Spacer(1, 12 * mm)]

    # ── Footer ───────────────────────────────────────────────────────────────
    elements.append(Paragraph(
        f"Generated on {date.today():%d %b %Y} · This is a system-generated salary slip "
        f"and does not require a signature.",
        small,
    ))

    doc.build(elements)
    return buf.getvalue()
