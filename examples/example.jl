# BLOCK: Julia Language Example
# Demonstrates the block parser working with Julia scientific computing files
# Julia uses # for comment syntax

using Statistics
using LinearAlgebra

# SUBBLOCK1: Mathematical Functions
# SUBBLOCK2: Vector Operations
function compute_magnitude(vec::Vector)
    """Compute the magnitude of a vector"""
    return sqrt(sum(vec .^ 2))
end

# SUBBLOCK2: Matrix Operations
function matrix_multiply(A::Matrix, B::Matrix)::Matrix
    """Custom matrix multiplication implementation"""
    return A * B
end

# SUBBLOCK1: Data Processing Functions
# SUBBLOCK2: Statistical Analysis
function analyze_dataset(data::Vector)
    """Analyze dataset and return summary statistics"""
    return Dict(
        :mean => mean(data),
        :median => median(data),
        :std => std(data),
        :min => minimum(data),
        :max => maximum(data)
    )
end

# SUBBLOCK2: Data Transformation
function normalize_data(data::Vector)
    """Normalize data to 0-1 range"""
    min_val = minimum(data)
    max_val = maximum(data)
    return (data .- min_val) ./ (max_val - min_val)
end

# SUBBLOCK1: Main Execution
function main()
    # SUBBLOCK2: Generate Sample Data
    sample_data = randn(1000)
    
    # SUBBLOCK2: Process and Analyze
    normalized = normalize_data(sample_data)
    stats = analyze_dataset(normalized)
    
    println("Dataset Statistics:")
    for (key, value) in stats
        println("  $key: $value")
    end
end

main()
