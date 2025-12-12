# Tesla Parts shop
use NextJS + Typescript. data must be fetched from backend api, but now if some data must be fetched, fetch it from the list somewhere from the app


We sell spare parts for Tesla cars.

We need to create a website for selling spare parts with the following features 
- immediate purchase processing (purchase page)
- selection of post office branch (Nova Post/Нова Пошта, if API is not public use some test data), 
- selection of a payment method. (No need to connect acquiring services; if the client specifies payment to an account, we will contact them ourselves, just save data to the list in the app)

Header:
- Про магазин
- Доставка та оплата
- Обмін та повернення
- FAQ
- Контакти
- Social networks buttons(instagram + telegram)
- Selected currency

Second row of header:
- logo (now just name "Tesla Parts")
- cart (with the count of selected items and sum)
- button "Оформити замовлення"

Menu (pop up menus):
- Model 3 
- Model X
- Model S
- search bar

The main content - just duplicate main menu but with images