import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';

const BacterialSimulationDashboard = () => {
  const canvasRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedScenario, setSelectedScenario] = useState('normal');
  const [data, setData] = useState([]);
  const [simulationState, setSimulationState] = useState({
    time: 0,
    population: 500,
    resources: 10000,
    genotypes: 1,
    cooperation: 0,
    competition: 0,
    avgFitness: 100,
  });

  // Simulate bacterial dynamics
  const simulateStep = (prevState) => {
    const dt = 0.1;
    let newState = { ...prevState };

    // Resource consumption based on population
    const consumptionRate = 0.5 + selectedScenario === 'resource_limited' ? 1.5 : 0;
    newState.resources = Math.max(0, newState.resources - newState.population * consumptionRate * dt);

    // Resource replenishment
    const replenishmentRate = selectedScenario === 'resource_limited' ? 10 : 50;
    newState.resources = Math.min(selectedScenario === 'resource_limited' ? 5000 : 10000, 
                                   newState.resources + replenishmentRate * dt);

    // Population growth based on resources
    const growthRate = (newState.resources / (selectedScenario === 'resource_limited' ? 5000 : 10000)) * 2;
    const deathRate = selectedScenario === 'hostile' ? 0.5 : 0.1;
    newState.population = Math.max(0, newState.population + (growthRate - deathRate) * newState.population * dt);

    // Antibiotic effects
    if (selectedScenario === 'antibiotic_gradual' && newState.time > 100) {
      const antiLevel = Math.min(1, (newState.time - 100) * 0.01);
      newState.population *= (1 - antiLevel * 0.1);
    } else if (selectedScenario === 'antibiotic_spike' && newState.time === 120) {
      newState.population *= 0.5;
    }

    // Mutation and diversity
    newState.genotypes = Math.min(50, newState.genotypes + (Math.random() < 0.02 ? 1 : 0));

    // Cooperation (biofilm formation)
    newState.cooperation = Math.min(1, newState.cooperation + (newState.population > 1000 ? 0.02 : 0));

    // Competition (toxin production)
    newState.competition = selectedScenario === 'hostile' ? 
      Math.min(1, newState.competition + 0.05) : 
      Math.max(0, newState.competition - 0.01);

    // Fitness adaptation
    newState.avgFitness = 50 + (newState.resources / (selectedScenario === 'resource_limited' ? 5000 : 10000)) * 100;

    newState.time += 1;
    return newState;
  };

  // Animation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSimulationState(prev => {
        const newState = simulateStep(prev);
        setData(d => [...d, {
          time: newState.time,
          population: Math.round(newState.population),
          resources: Math.round(newState.resources),
          genotypes: newState.genotypes,
          cooperation: parseFloat(newState.cooperation.toFixed(2)),
          competition: parseFloat(newState.competition.toFixed(2)),
          avgFitness: Math.round(newState.avgFitness),
        }]);
        return newState;
      });
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isRunning, speed]);

  // Canvas animation - spatial visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw bacteria as particles
    const cellSize = Math.max(2, Math.min(8, 1000 / simulationState.population));
    const cellCount = Math.min(simulationState.population / 10, 200);

    for (let i = 0; i < cellCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      // Color based on scenario
      let color = '#4CAF50'; // Green - normal
      if (selectedScenario === 'resource_limited') color = '#FF9800'; // Orange
      else if (selectedScenario === 'antibiotic_gradual') color = '#F44336'; // Red
      else if (selectedScenario === 'antibiotic_spike') color = '#9C27B0'; // Purple
      else if (selectedScenario === 'hostile') color = '#E91E63'; // Pink

      // Draw bacteria with glow
      ctx.fillStyle = color + '40';
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, cellSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw biofilm clusters (cooperation visualization)
    if (simulationState.cooperation > 0.1) {
      const biofilmCount = Math.floor(simulationState.cooperation * 5);
      for (let i = 0; i < biofilmCount; i++) {
        const cx = Math.random() * width;
        const cy = Math.random() * height;
        const radius = 30 + simulationState.cooperation * 20;
        
        ctx.strokeStyle = '#00BCD4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Fill with transparency
        ctx.fillStyle = '#00BCD44D';
        ctx.fill();
      }
    }

    // Draw resource particles
    const resourceCount = Math.floor((simulationState.resources / 10000) * 100);
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < resourceCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add timestamp
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Time: ${simulationState.time} | Pop: ${Math.round(simulationState.population)}`, 10, 20);

  }, [simulationState, selectedScenario]);

  const handleReset = () => {
    setIsRunning(false);
    setData([]);
    setSimulationState({
      time: 0,
      population: selectedScenario === 'resource_limited' ? 200 : 500,
      resources: selectedScenario === 'resource_limited' ? 5000 : 10000,
      genotypes: 1,
      cooperation: 0,
      competition: selectedScenario === 'hostile' ? 0.3 : 0,
      avgFitness: 100,
    });
  };

  const scenarioDescriptions = {
    normal: '🌿 Stable environment with abundant resources',
    resource_limited: '⚠️ Limited resources drive strong competition',
    antibiotic_gradual: '💊 Gradual antibiotic introduction at t=100',
    antibiotic_spike: '💊 Sudden antibiotic shock at t=120',
    hostile: '🔥 High mutation rate, intense toxin warfare',
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      color: '#ffffff',
      minHeight: '100vh',
      padding: '40px 20px',
      fontFamily: '"Courier New", monospace',
    }}>
      {/* Header */}
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '2.5em',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(90deg, #00D9FF 0%, #FF006E 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          🧬 Bacterial Population Simulator
        </h1>
        <p style={{ fontSize: '1.1em', opacity: 0.8, marginBottom: '30px' }}>
          Real-time agent-based modeling of bacterial evolution, competition, and cooperation
        </p>

        {/* Controls */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          border: '2px solid rgba(0,217,255,0.5)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '15px' }}>
            <button
              onClick={() => setIsRunning(!isRunning)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: isRunning ? '#FF006E' : '#00D9FF',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1em',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? 'Pause' : 'Start'}
            </button>

            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '2px solid #fff',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1em',
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              <RotateCcw size={20} /> Reset
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Settings size={20} />
              <label style={{ marginRight: '10px' }}>Speed:</label>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.5"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                style={{ width: '150px', cursor: 'pointer' }}
              />
              <span style={{ minWidth: '40px' }}>{speed}x</span>
            </div>
          </div>

          <div>
            <label style={{ marginRight: '15px', fontWeight: 'bold' }}>Scenario:</label>
            <select
              value={selectedScenario}
              onChange={(e) => {
                setSelectedScenario(e.target.value);
                handleReset();
              }}
              style={{
                padding: '8px 15px',
                borderRadius: '6px',
                border: '2px solid #00D9FF',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                fontSize: '1em',
                cursor: 'pointer',
              }}
            >
              <option value="normal">Normal</option>
              <option value="resource_limited">Resource Limited</option>
              <option value="antibiotic_gradual">Antibiotic (Gradual)</option>
              <option value="antibiotic_spike">Antibiotic (Spike)</option>
              <option value="hostile">Hostile</option>
            </select>
            <p style={{ marginTop: '10px', opacity: 0.8 }}>
              {scenarioDescriptions[selectedScenario]}
            </p>
          </div>
        </div>

        {/* Main Canvas Animation */}
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          border: '2px solid #00D9FF',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '30px',
          boxShadow: '0 0 30px rgba(0,217,255,0.3)',
        }}>
          <canvas
            ref={canvasRef}
            width={800}
            height={400}
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
        </div>

        {/* Metrics Dashboard */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px',
          marginBottom: '30px',
        }}>
          {[
            { label: 'Population', value: Math.round(simulationState.population), unit: 'cells' },
            { label: 'Resources', value: Math.round(simulationState.resources), unit: 'units' },
            { label: 'Genotypes', value: simulationState.genotypes, unit: 'types' },
            { label: 'Cooperation', value: (simulationState.cooperation * 100).toFixed(0), unit: '%' },
            { label: 'Competition', value: (simulationState.competition * 100).toFixed(0), unit: '%' },
            { label: 'Avg Fitness', value: Math.round(simulationState.avgFitness), unit: 'energy' },
          ].map((metric, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(0,217,255,0.1)',
                border: '1px solid rgba(0,217,255,0.5)',
                borderRadius: '8px',
                padding: '15px',
                textAlign: 'center',
              }}
            >
              <p style={{ opacity: 0.7, marginBottom: '8px' }}>{metric.label}</p>
              <p style={{ fontSize: '1.8em', fontWeight: 'bold', marginBottom: '5px' }}>
                {metric.value}
              </p>
              <p style={{ opacity: 0.6, fontSize: '0.9em' }}>{metric.unit}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        {data.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
          }}>
            {/* Population Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,217,255,0.3)',
              borderRadius: '8px',
              padding: '15px',
            }}>
              <h3 style={{ marginBottom: '10px' }}>Population Dynamics</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid #00D9FF' }} />
                  <Area type="monotone" dataKey="population" stroke="#4CAF50" fillOpacity={1} fill="url(#colorPop)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Resource Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,217,255,0.3)',
              borderRadius: '8px',
              padding: '15px',
            }}>
              <h3 style={{ marginBottom: '10px' }}>Resource Dynamics</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFA726" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FFA726" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid #00D9FF' }} />
                  <Area type="monotone" dataKey="resources" stroke="#FFA726" fillOpacity={1} fill="url(#colorRes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Behavioral Dynamics */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,217,255,0.3)',
              borderRadius: '8px',
              padding: '15px',
            }}>
              <h3 style={{ marginBottom: '10px' }}>Behavioral Dynamics</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid #00D9FF' }} />
                  <Legend />
                  <Line type="monotone" dataKey="cooperation" stroke="#00BCD4" name="Cooperation" dot={false} />
                  <Line type="monotone" dataKey="competition" stroke="#FF006E" name="Competition" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Genotype Diversity */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,217,255,0.3)',
              borderRadius: '8px',
              padding: '15px',
            }}>
              <h3 style={{ marginBottom: '10px' }}>Genotype Diversity</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid #00D9FF' }} />
                  <Line type="monotone" dataKey="genotypes" stroke="#9C27B0" name="Distinct Genotypes" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Fitness Evolution */}
            <div style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(0,217,255,0.3)',
              borderRadius: '8px',
              padding: '15px',
            }}>
              <h3 style={{ marginBottom: '10px' }}>Fitness Evolution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid #00D9FF' }} />
                  <Line type="monotone" dataKey="avgFitness" stroke="#FFD700" name="Avg Energy" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(0,217,255,0.3)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h3 style={{ marginBottom: '15px' }}>📋 Model Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>🔬 Agent-Based Modeling</p>
              <p style={{ opacity: 0.8 }}>Individual bacterial tracking with genetic traits, mutations, and fitness landscapes</p>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>🧬 Evolution Mechanics</p>
              <p style={{ opacity: 0.8 }}>Mutation-driven adaptation, antibiotic resistance, growth rate variation</p>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>🤝 Social Behaviors</p>
              <p style={{ opacity: 0.8 }}>Quorum sensing, biofilm formation, horizontal gene transfer, toxin warfare</p>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>⚖️ Resource Dynamics</p>
              <p style={{ opacity: 0.8 }}>Logistic growth, resource competition, metabolic efficiency variation</p>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>💊 Environmental Stress</p>
              <p style={{ opacity: 0.8 }}>Antibiotic selection pressure, starvation, competitive exclusion</p>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>📊 Tracking Metrics</p>
              <p style={{ opacity: 0.8 }}>Population density, genotype frequencies, cooperation/competition indices</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BacterialSimulationDashboard;
