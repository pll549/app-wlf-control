from flask import Flask, render_template, request, jsonify
from config import Config
from models import db, Transaction, Category
from datetime import datetime, timedelta

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

@app.with_appcontext
def create_tables():
    db.create_all()

@app.before_request
def init_db():
    db.create_all()
    # Create default categories if they don't exist
    if Category.query.count() == 0:
        default_categories = [
            Category(name='Salario', type='income'),
            Category(name='Freelance', type='income'),
            Category(name='Bonos', type='income'),
            Category(name='Alimentación', type='expense'),
            Category(name='Transporte', type='expense'),
            Category(name='Utilidades', type='expense'),
            Category(name='Entretenimiento', type='expense'),
            Category(name='Salud', type='expense'),
        ]
        db.session.add_all(default_categories)
        db.session.commit()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = Transaction.query.order_by(Transaction.date.desc()).all()
    return jsonify([t.to_dict() for t in transactions])

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.json
    try:
        transaction = Transaction(
            amount=float(data['amount']),
            description=data['description'],
            type=data['type'],
            category_id=int(data['category_id']),
            date=datetime.fromisoformat(data.get('date', datetime.now().isoformat()))
        )
        db.session.add(transaction)
        db.session.commit()
        return jsonify(transaction.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/transactions/<int:id>', methods=['GET'])
def get_transaction(id):
    transaction = Transaction.query.get(id)
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    return jsonify(transaction.to_dict())

@app.route('/api/transactions/<int:id>', methods=['PUT'])
def update_transaction(id):
    transaction = Transaction.query.get(id)
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    data = request.json
    try:
        transaction.amount = float(data.get('amount', transaction.amount))
        transaction.description = data.get('description', transaction.description)
        transaction.type = data.get('type', transaction.type)
        transaction.category_id = int(data.get('category_id', transaction.category_id))
        if 'date' in data:
            transaction.date = datetime.fromisoformat(data['date'])
        
        db.session.commit()
        return jsonify(transaction.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    transaction = Transaction.query.get(id)
    if not transaction:
        return jsonify({'error': 'Transaction not found'}), 404
    
    try:
        db.session.delete(transaction)
        db.session.commit()
        return jsonify({'message': 'Transaction deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])

@app.route('/api/summary', methods=['GET'])
def get_summary():
    now = datetime.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    income = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'income',
        Transaction.date >= month_start
    ).scalar() or 0
    
    expenses = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.type == 'expense',
        Transaction.date >= month_start
    ).scalar() or 0
    
    balance = income - expenses
    
    return jsonify({
        'income': income,
        'expenses': expenses,
        'balance': balance,
        'period': month_start.strftime('%B %Y')
    })

if __name__ == '__main__':
    app.run(debug=True)