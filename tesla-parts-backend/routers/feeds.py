import logging
import xml.sax.saxutils as saxutils
from typing import List
from fastapi import APIRouter, Depends, Response, HTTPException
from sqlmodel import Session, select
from database import get_session
from models import Product
from services.pricing import get_exchange_rate, compute_price_fields

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feed", tags=["feeds"])

# Base URL for the shop - should ideally be in environment variables
SHOP_BASE_URL = "https://teslapartscenter.com.ua"

async def get_active_products(session: Session) -> List[Product]:
    """
    Fetches all products from the database.
    In a production scenario, you might want to filter by 'is_active' or similar.
    """
    statement = select(Product)
    results = session.exec(statement)
    return results.all()

@router.get("/google-merchant.xml")
async def get_google_merchant_feed(session: Session = Depends(get_session)):
    """
    Generates a dynamic XML feed for Google Merchant Center in RSS 2.0 format.
    """
    try:
        products = await get_active_products(session)
        rate = get_exchange_rate(session)

        # XML Header and Channel metadata
        xml_output = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
            '<channel>',
            f'<title>{saxutils.escape("Tesla Parts Center")}</title>',
            f'<link>{SHOP_BASE_URL}</link>',
            f'<description>{saxutils.escape("Запчастини для Tesla з доставкою по Україні")}</description>'
        ]

        for product in products:
            # Calculate current prices based on exchange rate
            _, price_uah = compute_price_fields(product, rate)
            
            # Google required fields mapping
            p_id = saxutils.escape(str(product.id))
            p_title = saxutils.escape(product.name)
            p_description = saxutils.escape(product.description or product.name)
            p_link = f"{SHOP_BASE_URL}/product/{product.id}"
            p_image_link = saxutils.escape(product.image)
            p_price = f"{price_uah:.2f} UAH"
            p_availability = "in_stock" if product.inStock else "out_of_stock"
            p_condition = "new" # Default for Tesla Parts shop
            p_brand = saxutils.escape("Tesla")

            # Construct item XML
            item_xml = f"""
        <item>
            <g:id>{p_id}</g:id>
            <g:title>{p_title}</g:title>
            <g:description>{p_description}</g:description>
            <g:link>{p_link}</g:link>
            <g:image_link>{p_image_link}</g:image_link>
            <g:condition>{p_condition}</g:condition>
            <g:availability>{p_availability}</g:availability>
            <g:price>{p_price}</g:price>
            <g:brand>{p_brand}</g:brand>
        </item>"""
            xml_output.append(item_xml)

        # Close tags
        xml_output.append('</channel>')
        xml_output.append('</rss>')

        full_xml = "".join(xml_output)

        return Response(content=full_xml, media_type="application/xml")

    except Exception as e:
        logger.error(f"Failed to generate Google Merchant feed: {str(e)}", exc_info=True)
        # Return 500 without crashing the server
        raise HTTPException(status_code=500, detail="Internal Server Error: Failed to generate feed")
