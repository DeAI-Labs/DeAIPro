"""PDF Report Generation Service."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from io import BytesIO
import weasyprint
import structlog

logger = structlog.get_logger(__name__)


class PDFReportGenerator:
    """Generates PDF reports for subnets and market data."""
    
    @staticmethod
    def generate_market_report(
        tao_price: float,
        market_cap: float,
        volume_24h: float,
        active_subnets: int,
        subnets_data: List[Dict[str, Any]],
    ) -> BytesIO:
        """Generate a comprehensive market report PDF.
        
        Args:
            tao_price: Current TAO price in USD
            market_cap: Total market cap in USD
            volume_24h: 24h trading volume in USD
            active_subnets: Number of active subnets
            subnets_data: List of subnet data dictionaries
            
        Returns:
            BytesIO object containing the PDF
        """
        html_content = PDFReportGenerator._build_market_report_html(
            tao_price,
            market_cap,
            volume_24h,
            active_subnets,
            subnets_data,
        )
        
        return PDFReportGenerator._html_to_pdf(html_content)
    
    @staticmethod
    def generate_subnet_report(
        subnet_name: str,
        subnet_id: int,
        market_cap: float,
        apy: float,
        validators_count: int,
        miners_count: int,
        github_commits: int,
    ) -> BytesIO:
        """Generate a detailed subnet report PDF.
        
        Args:
            subnet_name: Name of the subnet
            subnet_id: ID of the subnet
            market_cap: Market cap in millions
            apy: Annual percentage yield
            validators_count: Number of validators
            miners_count: Number of miners
            github_commits: GitHub commits in last 30 days
            
        Returns:
            BytesIO object containing the PDF
        """
        html_content = PDFReportGenerator._build_subnet_report_html(
            subnet_name,
            subnet_id,
            market_cap,
            apy,
            validators_count,
            miners_count,
            github_commits,
        )
        
        return PDFReportGenerator._html_to_pdf(html_content)
    
    @staticmethod
    def _build_market_report_html(
        tao_price: float,
        market_cap: float,
        volume_24h: float,
        active_subnets: int,
        subnets_data: List[Dict[str, Any]],
    ) -> str:
        """Build HTML for market report."""
        timestamp = datetime.utcnow().isoformat()
        
        subnet_rows = ""
        for subnet in subnets_data[:10]:  # Top 10 subnets
            subnet_rows += f"""
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">{subnet.get('name', 'N/A')}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${subnet.get('market_cap_millions', 0):.2f}M</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">{subnet.get('apy', 0):.2f}%</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">{subnet.get('validators_count', 0)}</td>
            </tr>
            """
        
        html = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        color: #1f2937;
                        margin: 0;
                        padding: 20px;
                        background-color: #f9fafb;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                        color: white;
                        padding: 30px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }}
                    .title {{
                        font-size: 28px;
                        font-weight: bold;
                        margin: 0;
                        padding-bottom: 10px;
                    }}
                    .subtitle {{
                        font-size: 12px;
                        opacity: 0.9;
                    }}
                    .stats-grid {{
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 30px;
                    }}
                    .stat-box {{
                        background: white;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }}
                    .stat-label {{
                        font-size: 12px;
                        color: #6b7280;
                        font-weight: 500;
                        margin-bottom: 5px;
                    }}
                    .stat-value {{
                        font-size: 20px;
                        font-weight: bold;
                        color: #1f2937;
                    }}
                    .section {{
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        margin-bottom: 20px;
                    }}
                    .section-title {{
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        color: #1f2937;
                    }}
                    table {{
                        width: 100%;
                        border-collapse: collapse;
                    }}
                    th {{
                        background-color: #f3f4f6;
                        padding: 10px;
                        text-align: left;
                        font-weight: 600;
                        border-bottom: 1px solid #e5e7eb;
                    }}
                    .footer {{
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 11px;
                        color: #6b7280;
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">DeAIPro Market Report</div>
                    <div class="subtitle">Generated on {timestamp}</div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">TAO Price</div>
                        <div class="stat-value">${tao_price:.2f}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Market Cap</div>
                        <div class="stat-value">${market_cap/1e9:.2f}B</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">24h Volume</div>
                        <div class="stat-value">${volume_24h/1e6:.2f}M</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Active Subnets</div>
                        <div class="stat-value">{active_subnets}</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Top Subnets by Market Cap</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Subnet Name</th>
                                <th style="text-align: right;">Market Cap</th>
                                <th style="text-align: right;">APY</th>
                                <th style="text-align: right;">Validators</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subnet_rows}
                        </tbody>
                    </table>
                </div>
                
                <div class="footer">
                    <p>This report is generated automatically by DeAIPro. Data may be subject to change.</p>
                    <p>© 2026 DeAIPro. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        
        return html
    
    @staticmethod
    def _build_subnet_report_html(
        subnet_name: str,
        subnet_id: int,
        market_cap: float,
        apy: float,
        validators_count: int,
        miners_count: int,
        github_commits: int,
    ) -> str:
        """Build HTML for subnet report."""
        timestamp = datetime.utcnow().isoformat()
        
        html = f"""
        <html>
            <head>
                <style>
                    body {{
                        font-family: Arial, sans-serif;
                        color: #1f2937;
                        margin: 0;
                        padding: 20px;
                        background-color: #f9fafb;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                        color: white;
                        padding: 30px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }}
                    .title {{
                        font-size: 28px;
                        font-weight: bold;
                        margin: 0;
                        padding-bottom: 10px;
                    }}
                    .subtitle {{
                        font-size: 12px;
                        opacity: 0.9;
                    }}
                    .stats-grid {{
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 30px;
                    }}
                    .stat-box {{
                        background: white;
                        padding: 15px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }}
                    .stat-label {{
                        font-size: 12px;
                        color: #6b7280;
                        font-weight: 500;
                        margin-bottom: 5px;
                    }}
                    .stat-value {{
                        font-size: 20px;
                        font-weight: bold;
                        color: #1f2937;
                    }}
                    .section {{
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        margin-bottom: 20px;
                    }}
                    .section-title {{
                        font-size: 16px;
                        font-weight: bold;
                        margin-bottom: 15px;
                        color: #1f2937;
                    }}
                    .footer {{
                        margin-top: 30px;
                        padding-top: 15px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 11px;
                        color: #6b7280;
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">{subnet_name} - Detailed Report</div>
                    <div class="subtitle">Subnet ID: {subnet_id} | Generated on {timestamp}</div>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-label">Market Cap</div>
                        <div class="stat-value">${market_cap:.2f}M</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">APY</div>
                        <div class="stat-value">{apy:.2f}%</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-label">Validators</div>
                        <div class="stat-value">{validators_count}</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Network Statistics</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <div class="stat-label">Number of Miners</div>
                            <div style="font-size: 18px; font-weight: bold;">{miners_count}</div>
                        </div>
                        <div>
                            <div class="stat-label">GitHub Commits (30d)</div>
                            <div style="font-size: 18px; font-weight: bold;">{github_commits}</div>
                        </div>
                    </div>
                </div>
                
                <div class="footer">
                    <p>This report is generated automatically by DeAIPro. Data may be subject to change.</p>
                    <p>© 2026 DeAIPro. All rights reserved.</p>
                </div>
            </body>
        </html>
        """
        
        return html
    
    @staticmethod
    def _html_to_pdf(html_content: str) -> BytesIO:
        """Convert HTML string to PDF BytesIO object."""
        try:
            pdf_bytes = weasyprint.HTML(string=html_content).write_pdf()
            return BytesIO(pdf_bytes)
        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            raise
