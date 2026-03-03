# BLOCK: Data Processing Pipeline

import pandas as pd
import json

class DataProcessor:
    # SUBBLOCK1: Data Loading
    
    def load_data(self, file_path):
        # SUBBLOCK2: Read CSV File
        df = pd.read_csv(file_path)
        print(f"Loaded {len(df)} rows")
        
        # SUBBLOCK2: Validate Schema
        required_cols = ['id', 'name', 'value']
        if not all(col in df.columns for col in required_cols):
            raise ValueError("Missing required columns")
        
        return df
    
    # SUBBLOCK1: Data Transformation
    
    def transform_data(self, df):
        # SUBBLOCK2: Clean Missing Values
        df = df.dropna()
        
        # SUBBLOCK2: Normalize Values
        df['value'] = (df['value'] - df['value'].mean()) / df['value'].std()
        
        # SUBBLOCK2: Add Computed Fields
        df['category'] = df['value'].apply(lambda x: 'high' if x > 1 else 'low')
        
        return df
    
    # SUBBLOCK1: Data Export
    
    def export_results(self, df, output_path):
        # SUBBLOCK2: Convert to JSON
        result = df.to_dict(orient='records')
        
        # SUBBLOCK2: Write to File
        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Exported to {output_path}")

# BLOCK: Utility Functions

def validate_file_exists(path):
    # SUBBLOCK1: Check File Path
    import os
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")
    
    # SUBBLOCK1: Check File Size
    size = os.path.getsize(path)
    if size > 100_000_000:  # 100MB
        print("Warning: Large file detected")
    
    return True
