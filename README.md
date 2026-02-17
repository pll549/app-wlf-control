# Expense and Income Management Web Application

This project is a web application for managing expenses and income using Python Flask.

## Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/pll549/app-wlf-control.git
   cd app-wlf-control
   ```
2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   ```
3. **Activate the Virtual Environment**:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Run the Application**:
   ```bash
   flask run
   ```

## Project Structure
```
app-wlf-control/
├── app/
│   ├── __init__.py
│   ├── routes.py
│   ├── models.py
│   ├── templates/
│   └── static/
├── venv/
├── requirements.txt
└── README.md
```