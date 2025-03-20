import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';

const MathCombinationsVisualizer = () => {
  const [lists, setLists] = useState([
    { id: 'a', label: 'a', values: [5, 10, 15], inputValue: '5, 10, 15' },
    { id: 'b', label: 'b', values: [2, 4, 5], inputValue: '2, 4, 5' }
  ]);
  
  const [operation, setOperation] = useState('*');
  const [formula, setFormula] = useState('a * b');
  const [results, setResults] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [hoveredResult, setHoveredResult] = useState(null);
  const [stats, setStats] = useState({ min: 0, q1: 0, median: 0, q3: 0, max: 0 });
  const [jitterPositions, setJitterPositions] = useState({});

  // Calculate combinations of all lists
  useEffect(() => {
    try {
      const listsObj = {};
      lists.forEach(list => {
        listsObj[list.id] = list.values;
      });
      
      // Generate all combinations
      const allCombinations = generateCombinations(listsObj);
      setCombinations(allCombinations);
      
      // Calculate results using the formula
      const calculatedResults = allCombinations.map(combo => {
        // Create a scope with the combination values
        const scope = {};
        Object.keys(combo).forEach(key => {
          scope[key] = combo[key];
        });
        
        // Evaluate the formula
        let result;
        try {
          // Replace operators with JavaScript equivalents
          let jsFormula = formula
            .replace(/\*/g, '*')
            .replace(/×/g, '*')
            .replace(/÷/g, '/');
          
          // Evaluate using Function constructor for safety
          const evalFunc = new Function(...Object.keys(scope), `return ${jsFormula}`);
          result = evalFunc(...Object.values(scope));
        } catch (e) {
          result = NaN;
        }
        
        return {
          combination: combo,
          result: result
        };
      }).filter(item => !isNaN(item.result));
      
      setResults(calculatedResults);
      
      // Generate and store jitter positions for each result
      const newJitterPositions = {};
      calculatedResults.forEach((item, index) => {
        // Generate a unique key for each combination
        const key = JSON.stringify(item.combination);
        // Only generate new jitter if it doesn't exist yet
        if (!jitterPositions[key]) {
          newJitterPositions[key] = (Math.random() * 70) + 15; // 15-85% width
        }
      });
    
      // Merge existing positions with new ones to maintain positions for existing points
      setJitterPositions(prev => ({...prev, ...newJitterPositions}));
    
      // Calculate statistics
      if (calculatedResults.length > 0) {
        const sortedResults = [...calculatedResults]
          .sort((a, b) => a.result - b.result)
          .map(item => item.result);
        
        const min = sortedResults[0];
        const max = sortedResults[sortedResults.length - 1];
        const q1 = calculatePercentile(sortedResults, 25);
        const median = calculatePercentile(sortedResults, 50);
        const q3 = calculatePercentile(sortedResults, 75);
        
        setStats({ min, q1, median, q3, max });
      }
    } catch (error) {
      console.error("Error calculating combinations:", error);
    }
  }, [lists, formula]);

  // Generate all possible combinations
  const generateCombinations = (lists) => {
    const listIds = Object.keys(lists);
    const combinations = [];
    
    function combine(index, current) {
      if (index === listIds.length) {
        combinations.push({...current});
        return;
      }
      
      const listId = listIds[index];
      const listValues = lists[listId];
      
      for (let i = 0; i < listValues.length; i++) {
        current[listId] = listValues[i];
        combine(index + 1, current);
      }
    }
    
    combine(0, {});
    return combinations;
  };
  
  // Calculate percentile for statistics
  const calculatePercentile = (sortedData, percentile) => {
    const index = (percentile / 100) * (sortedData.length - 1);
    if (Number.isInteger(index)) {
      return sortedData[index];
    } else {
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;
      return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
    }
  };

  // Handle list value changes
  const handleListChange = (id, newValue) => {
    setLists(prevLists => 
      prevLists.map(list => 
        list.id === id 
          ? {
              ...list,
              inputValue: newValue,
              values: newValue
                .split(',')
                .map(val => parseFloat(val.trim()))
                .filter(val => !isNaN(val))
            }
          : list
      )
    );
  };

  // Add a new list
  const addList = () => {
    const nextId = String.fromCharCode(97 + lists.length); // a, b, c, ...
    setLists([...lists, { 
      id: nextId, 
      label: nextId, 
      values: [1, 2, 3], 
      inputValue: '1, 2, 3' 
    }]);
    
    // Update formula to include the new list
    if (formula.trim() === '') {
      setFormula(nextId);
    }
  };

  // Remove a list
  const removeList = (id) => {
    if (lists.length <= 2) return; // Keep at least 2 lists
    setLists(lists.filter(list => list.id !== id));
  };

  // Scale for visualization
  const scale = (value, stats) => {
    if (stats.max === stats.min) return 50; // If all values are the same
    return ((value - stats.min) / (stats.max - stats.min)) * 100;
  };

  // Function to determine if a value should be highlighted
  const isHighlighted = (listId, value) => {
    if (!hoveredResult) return false;
    return hoveredResult.combination[listId] === value;
  };

  return (
    <div className="container">
      <h1>Mathematical Combinations Visualizer</h1>
      
      {/* Lists input section */}
      <div className="section">
        <h2>Input Lists</h2>
        <div className="lists-grid">
          {lists.map((list) => (
            <div key={list.id} className="list-card">
              <div className="list-header">
                <label>List {list.label}:</label>
                {lists.length > 2 && (
                  <button 
                    onClick={() => removeList(list.id)}
                    className="remove-btn"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={list.inputValue}
                onChange={(e) => handleListChange(list.id, e.target.value)}
                className="list-input"
                placeholder="Enter comma-separated values"
              />
              <div className="list-values">
                {list.values.map((value, idx) => (
                  <span 
                    key={idx}
                    className={`value-badge ${isHighlighted(list.id, value) ? 'highlighted' : ''}`}
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={addList}
          className="add-btn"
        >
          <Plus size={16} /> Add List
        </button>
      </div>
      
      {/* Formula input section */}
      <div className="section">
        <h2>Formula</h2>
        <div className="formula-input">
          <span>y =</span>
          <input
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            className="formula-field"
            placeholder="Enter formula (e.g., a * b + c)"
          />
        </div>
        <div className="formula-help">
          Use list identifiers ({lists.map(l => l.id).join(', ')}) with operators (+, -, *, /), and parentheses.
        </div>
      </div>
      
      {/* Results visualization */}
      <div className="results-section">
        <h2>Results Visualization</h2>
        
        {results.length > 0 ? (
          <div className="visualization">
            {/* Boxplot */}
            <div className="boxplot">
              {/* Min, Max, Quartiles */}
              <div className="stat-line min" style={{bottom: `${scale(stats.min, stats)}%`}}></div>
              <div className="stat-line q1" style={{bottom: `${scale(stats.q1, stats)}%`}}></div>
              <div className="stat-line median" style={{bottom: `${scale(stats.median, stats)}%`}}></div>
              <div className="stat-line q3" style={{bottom: `${scale(stats.q3, stats)}%`}}></div>
              <div className="stat-line max" style={{bottom: `${scale(stats.max, stats)}%`}}></div>
              
              {/* Box */}
              <div 
                className="box"
                style={{
                  bottom: `${scale(stats.q1, stats)}%`,
                  height: `${scale(stats.q3, stats) - scale(stats.q1, stats)}%`
                }}
              ></div>
              
              {/* Median line */}
              <div 
                className="median-line"
                style={{
                  bottom: `${scale(stats.median, stats)}%`
                }}
              ></div>
              
              {/* Whiskers */}
              <div 
                className="whisker"
                style={{
                  bottom: `${scale(stats.min, stats)}%`,
                  height: `${scale(stats.q1, stats) - scale(stats.min, stats)}%`
                }}
              ></div>
              <div 
                className="whisker"
                style={{
                  bottom: `${scale(stats.q3, stats)}%`,
                  height: `${scale(stats.max, stats) - scale(stats.q3, stats)}%`
                }}
              ></div>
              
              {/* Labels */}
              <div className="stat-label min-label" style={{bottom: `${scale(stats.min, stats)}%`}}>
                {stats.min.toFixed(1)}
              </div>
              <div className="stat-label median-label" style={{bottom: `${scale(stats.median, stats)}%`}}>
                {stats.median.toFixed(1)}
              </div>
              <div className="stat-label max-label" style={{bottom: `${scale(stats.max, stats)}%`}}>
                {stats.max.toFixed(1)}
              </div>
            </div>
            
            {/* Scatter plot */}
            <div className="scatter-plot">
            {results.map((item, idx) => {
  const key = JSON.stringify(item.combination);
  const jitter = jitterPositions[key] || 50; // Fallback to center if no jitter
  
  return (
    <div
      key={key}
      className={`dot ${hoveredResult === item ? 'highlighted' : ''}`}
      style={{
        bottom: `${scale(item.result, stats)}%`,
        left: `${jitter}%`
      }}
      onMouseEnter={() => setHoveredResult(item)}
      onMouseLeave={() => setHoveredResult(null)}
      title={`Result: ${item.result.toFixed(2)}`}
    ></div>
  );
})}
            </div>
          </div>
        ) : (
          <div className="no-results">
            <p>No valid results to display. Check your formula and input values.</p>
          </div>
        )}
        
        {/* Hover details */}
        {hoveredResult && (
          <div className="hover-details">
            <h3>Selected Combination:</h3>
            <div className="combinations-grid">
              {Object.entries(hoveredResult.combination).map(([listId, value]) => (
                <div key={listId} className="combination-item">
                  <span className="list-id">{listId}:</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
            <div className="result-value">
              <span className="result-label">Result:</span>
              <span>{hoveredResult.result.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MathCombinationsVisualizer;
