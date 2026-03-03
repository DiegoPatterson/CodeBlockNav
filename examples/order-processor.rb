# BLOCK: E-commerce Order Processing System

require 'json'
require 'date'

# SUBBLOCK1: Order Class

class Order
  attr_reader :id, :customer_id, :items, :status, :created_at
  
  # SUBBLOCK2: Initialization
  
  def initialize(customer_id, items = [])
    @id = generate_order_id
    @customer_id = customer_id
    @items = items
    @status = 'pending'
    @created_at = Time.now
  end
  
  # SUBBLOCK2: Order Management
  
  def add_item(product_id, quantity, price)
    # SUBBLOCK3: Validate Input
    raise ArgumentError, 'Quantity must be positive' if quantity <= 0
    raise ArgumentError, 'Price must be positive' if price <= 0
    
    # SUBBLOCK3: Add Item to Order
    @items << {
      product_id: product_id,
      quantity: quantity,
      price: price,
      subtotal: quantity * price
    }
  end
  
  def remove_item(product_id)
    @items.reject! { |item| item[:product_id] == product_id }
  end
  
  # SUBBLOCK2: Price Calculation
  
  def calculate_subtotal
    @items.sum { |item| item[:subtotal] }
  end
  
  def calculate_tax(rate = 0.08)
    # SUBBLOCK3: Apply Tax Rate
    calculate_subtotal * rate
  end
  
  def calculate_shipping
    # SUBBLOCK3: Determine Shipping Cost
    subtotal = calculate_subtotal
    case subtotal
    when 0...50
      9.99
    when 50...100
      4.99
    else
      0.00  # Free shipping
    end
  end
  
  def calculate_total
    calculate_subtotal + calculate_tax + calculate_shipping
  end
  
  # SUBBLOCK2: Status Management
  
  def process!
    # SUBBLOCK3: Validate Order
    raise 'Order has no items' if @items.empty?
    raise 'Order already processed' if @status != 'pending'
    
    # SUBBLOCK3: Update Status
    @status = 'processing'
    puts "Order #{@id} is being processed"
  end
  
  def ship!
    raise 'Order must be processed first' unless @status == 'processing'
    @status = 'shipped'
    puts "Order #{@id} has been shipped"
  end
  
  def complete!
    @status = 'completed'
    puts "Order #{@id} is completed"
  end
  
  # SUBBLOCK2: Export Methods
  
  def to_json(*args)
    {
      id: @id,
      customer_id: @customer_id,
      items: @items,
      subtotal: calculate_subtotal,
      tax: calculate_tax,
      shipping: calculate_shipping,
      total: calculate_total,
      status: @status,
      created_at: @created_at
    }.to_json(*args)
  end
  
  private
  
  def generate_order_id
    "ORD-#{Time.now.strftime('%Y%m%d')}-#{rand(10000..99999)}"
  end
end

# SUBBLOCK1: Order Processor Service

class OrderProcessor
  # SUBBLOCK2: Process Multiple Orders
  
  def self.batch_process(orders)
    # SUBBLOCK3: Filter Valid Orders
    valid_orders = orders.select { |order| order.status == 'pending' }
    
    # SUBBLOCK3: Process Each Order
    results = valid_orders.map do |order|
      begin
        order.process!
        { order_id: order.id, success: true }
      rescue StandardError => e
        { order_id: order.id, success: false, error: e.message }
      end
    end
    
    # SUBBLOCK3: Generate Report
    generate_batch_report(results)
  end
  
  # SUBBLOCK2: Generate Reports
  
  def self.generate_batch_report(results)
    successful = results.count { |r| r[:success] }
    failed = results.count { |r| !r[:success] }
    
    puts "\n=== Batch Processing Report ==="
    puts "Total: #{results.size}"
    puts "Successful: #{successful}"
    puts "Failed: #{failed}"
    puts "================================\n"
    
    results
  end
end

# BLOCK: Example Usage

# SUBBLOCK1: Create Sample Orders

order1 = Order.new('CUST-001')
order1.add_item('PROD-123', 2, 29.99)
order1.add_item('PROD-456', 1, 49.99)

order2 = Order.new('CUST-002')
order2.add_item('PROD-789', 3, 15.00)

# SUBBLOCK1: Process Orders

order1.process!
order1.ship!
order1.complete!

puts "\nOrder 1 Total: $#{order1.calculate_total.round(2)}"
puts "Order 1 JSON:"
puts order1.to_json
