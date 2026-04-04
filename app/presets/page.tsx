'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PresetGroup {
  id: string
  name: string
  numbers: string[]
  createdAt?: string
  updatedAt?: string
}

interface LotteryEntry {
  id: string
  number: string
  digitLength: number
  type: 'thai' | 'hanoi' | 'yeekee'
  date: string
}

interface AnalysisResult {
  number: string
  count: number
  percentage: number
  types: {
    thai: number
    hanoi: number
    yeekee: number
  }
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export default function PresetsPage() {
  const [presetGroups, setPresetGroups] = useState<PresetGroup[]>([])
  const [newPresetName, setNewPresetName] = useState<string>('')
  const [newPresetNumbers, setNewPresetNumbers] = useState<string>('')
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [analyzingGroupId, setAnalyzingGroupId] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<{ [groupId: string]: AnalysisResult[] }>({})

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void => {
    const id = Date.now().toString()
    const newToast: Toast = { id, message, type }
    setToasts((prev) => [...prev, newToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  useEffect(() => {
    fetchPresetGroups()
  }, [])

  const fetchPresetGroups = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/presets')
      if (!response.ok) {
        throw new Error('Failed to fetch preset groups')
      }
      const data = await response.json()
      setPresetGroups(data.data || [])
    } catch (error) {
      console.error('Error fetching preset groups:', error)
      showToast('❌ เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const addPresetGroup = async (): Promise<void> => {
    if (!newPresetName.trim()) {
      showToast('กรุณากรอกชื่อกลุ่มเลข', 'warning')
      return
    }
    if (!newPresetNumbers.trim()) {
      showToast('กรุณากรอกเลข', 'warning')
      return
    }

    const numbers = newPresetNumbers
      .split(/[,\s]+/)
      .map(n => n.trim())
      .filter(n => /^\d+$/.test(n))

    if (numbers.length === 0) {
      showToast('ไม่พบเลขที่ถูกต้อง', 'warning')
      return
    }

    try {
      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newPresetName,
          numbers: numbers
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save preset group')
      }

      const savedGroup = await response.json()
      setPresetGroups([savedGroup, ...presetGroups])
      setNewPresetName('')
      setNewPresetNumbers('')
      showToast(`✅ เพิ่มกลุ่มเลข "${newPresetName}" สำเร็จ`, 'success')
    } catch (error) {
      console.error('Error saving preset group:', error)
      showToast('❌ เกิดข้อผิดพลาดในการบันทึก', 'error')
    }
  }

  const deletePresetGroup = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/presets/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete preset group')
      }

      setPresetGroups(presetGroups.filter(g => g.id !== id))
      setSelectedPresets(selectedPresets.filter(sid => sid !== id))
      showToast('✅ ลบกลุ่มเลขสำเร็จ', 'success')
    } catch (error) {
      console.error('Error deleting preset group:', error)
      showToast('❌ เกิดข้อผิดพลาดในการลบ', 'error')
    }
  }

  const togglePresetSelection = (id: string): void => {
    if (selectedPresets.includes(id)) {
      setSelectedPresets(selectedPresets.filter(sid => sid !== id))
    } else {
      setSelectedPresets([...selectedPresets, id])
    }
  }

  const selectAll = (): void => {
    setSelectedPresets(presetGroups.map(g => g.id))
    showToast('✅ เลือกทั้งหมดแล้ว', 'info')
  }

  const deselectAll = (): void => {
    setSelectedPresets([])
    showToast('✅ ยกเลิกการเลือกทั้งหมดแล้ว', 'info')
  }

  const analyzePresetGroup = async (groupId: string): Promise<void> => {
    setAnalyzingGroupId(groupId)
    
    try {
      // Fetch all lottery entries from database
      const response = await fetch('/api/lottery?limit=10000')
      if (!response.ok) {
        throw new Error('Failed to fetch lottery entries')
      }

      const data = await response.json()
      const entries: LotteryEntry[] = data.data || []

      if (entries.length === 0) {
        showToast('⚠️ ไม่พบข้อมูลเลขที่บันทึก', 'warning')
        setAnalyzingGroupId(null)
        return
      }

      const group = presetGroups.find(g => g.id === groupId)
      
      if (!group) {
        showToast('❌ ไม่พบกลุ่มเลข', 'error')
        setAnalyzingGroupId(null)
        return
      }

      // Count frequency of each number in the preset group by type
      const frequencyMap: { [key: string]: { count: number; types: { thai: number; hanoi: number; yeekee: number } } } = {}
      group.numbers.forEach(num => {
        frequencyMap[num] = { count: 0, types: { thai: 0, hanoi: 0, yeekee: 0 } }
      })

      entries.forEach(entry => {
        if (group.numbers.includes(entry.number)) {
          frequencyMap[entry.number].count++
          frequencyMap[entry.number].types[entry.type]++
        }
      })

      // Calculate total occurrences
      const totalOccurrences = Object.values(frequencyMap).reduce((sum, item) => sum + item.count, 0)

      // Create analysis results sorted by frequency
      const results: AnalysisResult[] = Object.entries(frequencyMap)
        .map(([number, data]) => ({
          number,
          count: data.count,
          percentage: totalOccurrences > 0 ? (data.count / totalOccurrences) * 100 : 0,
          types: data.types
        }))
        .sort((a, b) => b.count - a.count)

      setAnalysisResults(prev => ({
        ...prev,
        [groupId]: results
      }))

      showToast('✅ วิเคราะห์เสร็จสิ้น', 'success')
    } catch (error) {
      console.error('Error analyzing preset group:', error)
      showToast('❌ เกิดข้อผิดพลาดในการวิเคราะห์', 'error')
    } finally {
      setAnalyzingGroupId(null)
    }
  }

  const closeAnalysis = (groupId: string): void => {
    setAnalysisResults(prev => {
      const newResults = { ...prev }
      delete newResults[groupId]
      return newResults
    })
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Toast notifications */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              marginBottom: '10px',
              padding: '12px 20px',
              borderRadius: '8px',
              background: toast.type === 'success' ? '#27ae60' : toast.type === 'error' ? '#e74c3c' : toast.type === 'warning' ? '#f39c12' : '#3498db',
              color: 'white',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '10px',
          flexWrap: 'wrap',
          gap: '15px'
        }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: '700', color: '#2c3e50', margin: 0 }}>
            📌 จัดการเลขตั้งต้น
          </h1>
          <Link 
            href="/"
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            ← กลับหน้าหลัก
          </Link>
        </div>
        <p style={{ color: '#7f8c8d', fontSize: 'clamp(0.9rem, 2vw, 1rem)', margin: '10px 0 0 0' }}>
          จัดการกลุ่มเลขตั้งต้น เช่น เลขอมตะ, เลขตองแท้ เพื่อใช้ในการวิเคราะห์
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Add New Preset Group */}
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#2c3e50' }}>
            ➕ เพิ่มกลุ่มเลขใหม่
          </h2>
          
          <div className="input-group" style={{ marginBottom: '15px' }}>
            <label htmlFor="preset-name" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e' }}>
              ชื่อกลุ่มเลข
            </label>
            <input
              id="preset-name"
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="เช่น เลขอมตะ, เลขตองแท้, เลขมงคล"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '15px' }}>
            <label htmlFor="preset-numbers" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e' }}>
              เลข (คั่นด้วยเครื่องหมาย , หรือ เว้นวรรค)
            </label>
            <textarea
              id="preset-numbers"
              value={newPresetNumbers}
              onChange={(e) => setNewPresetNumbers(e.target.value)}
              placeholder="เช่น 1234, 5678, 9012 หรือ 1234 5678 9012"
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical',
                fontFamily: 'monospace',
              }}
            />
          </div>
          
          <button 
            className="button" 
            style={{ 
              width: '100%',
              background: '#27ae60',
              color: 'white',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} 
            onClick={addPresetGroup}
          >
            ➕ เพิ่มกลุ่มเลข
          </button>
        </div>

        {/* Statistics */}
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#2c3e50' }}>
            📊 สถิติ
          </h2>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#ecf0f1', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '5px' }}>กลุ่มเลขทั้งหมด</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3498db' }}>{presetGroups.length}</div>
            </div>
            
            <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '5px' }}>กลุ่มที่เลือก</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#27ae60' }}>{selectedPresets.length}</div>
            </div>
            
            <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '5px' }}>เลขทั้งหมด</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f39c12' }}>
                {presetGroups.reduce((sum, g) => sum + g.numbers.length, 0)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={selectAll}
              style={{
                flex: 1,
                padding: '10px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              ✓ เลือกทั้งหมด
            </button>
            <button
              onClick={deselectAll}
              style={{
                flex: 1,
                padding: '10px',
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >
              ✗ ยกเลิกทั้งหมด
            </button>
          </div>
        </div>
      </div>

      {/* Preset Groups List */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#2c3e50' }}>
          📋 กลุ่มเลขที่บันทึก ({presetGroups.length})
        </h2>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '1.2rem' }}>⏳ กำลังโหลดข้อมูล...</div>
          </div>
        ) : presetGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📭</div>
            <div style={{ fontSize: '1.2rem' }}>ยังไม่มีกลุ่มเลข</div>
            <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>เพิ่มกลุ่มเลขใหม่ด้านบน</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {presetGroups.map((group) => (
              <div 
                key={group.id} 
                style={{
                  padding: '20px',
                  border: selectedPresets.includes(group.id) ? '3px solid #27ae60' : '2px solid #ddd',
                  borderRadius: '12px',
                  background: selectedPresets.includes(group.id) ? '#e8f5e9' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: selectedPresets.includes(group.id) ? '0 4px 12px rgba(39, 174, 96, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onClick={() => togglePresetSelection(group.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      {selectedPresets.includes(group.id) && (
                        <span style={{ 
                          color: '#27ae60', 
                          fontSize: '1.5rem',
                          fontWeight: '700'
                        }}>✓</span>
                      )}
                      <h3 style={{ 
                        fontSize: '1.3rem', 
                        fontWeight: '700', 
                        color: '#2c3e50',
                        margin: 0
                      }}>
                        {group.name}
                      </h3>
                    </div>
                    
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#7f8c8d',
                      marginBottom: '10px'
                    }}>
                      📊 จำนวน: {group.numbers.length} เลข
                    </div>
                    
                    <div style={{ 
                      padding: '10px',
                      background: '#f8f9fa',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      color: '#34495e',
                      fontFamily: 'monospace',
                      maxHeight: '100px',
                      overflowY: 'auto'
                    }}>
                      {group.numbers.join(', ')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        analyzePresetGroup(group.id)
                      }}
                      disabled={analyzingGroupId === group.id}
                      style={{
                        background: analyzingGroupId === group.id ? '#95a5a6' : '#3498db',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: analyzingGroupId === group.id ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      {analyzingGroupId === group.id ? '⏳ กำลังวิเคราะห์...' : '📊 วิเคราะห์'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`ต้องการลบกลุ่มเลข "${group.name}" ใช่หรือไม่?`)) {
                          deletePresetGroup(group.id)
                        }
                      }}
                      style={{
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                      }}
                    >
                      🗑️ ลบ
                    </button>
                  </div>
                </div>

                {/* Analysis Results */}
                {analysisResults[group.id] && (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      marginTop: '15px', 
                      padding: '15px', 
                      background: 'white',
                      borderRadius: '8px',
                      border: '2px solid #3498db'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '1.1rem' }}>
                        📊 ผลการวิเคราะห์
                      </h4>
                      <button
                        onClick={() => closeAnalysis(group.id)}
                        style={{
                          background: '#95a5a6',
                          color: 'white',
                          border: 'none',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        ✕ ปิด
                      </button>
                    </div>

                    {analysisResults[group.id].length === 0 || analysisResults[group.id].every(r => r.count === 0) ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                        ไม่พบเลขในกลุ่มนี้ในข้อมูลที่บันทึก
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                        {analysisResults[group.id]
                          .filter(result => result.count > 0)
                          .map((result, idx) => (
                            <div 
                              key={idx}
                              style={{
                                padding: '12px',
                                background: '#f8f9fa',
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                border: '1px solid #e0e0e0'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ 
                                    fontSize: '0.85rem', 
                                    color: '#7f8c8d',
                                    fontWeight: '600',
                                    minWidth: '30px'
                                  }}>
                                    #{idx + 1}
                                  </span>
                                  <span style={{ 
                                    fontSize: '1.2rem', 
                                    fontWeight: '700',
                                    color: '#2c3e50',
                                    fontFamily: 'monospace'
                                  }}>
                                    {result.number}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ 
                                    fontSize: '0.9rem',
                                    background: '#3498db',
                                    color: 'white',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontWeight: '600'
                                  }}>
                                    {result.count} ครั้ง
                                  </span>
                                  <span style={{ 
                                    fontSize: '0.85rem',
                                    color: '#7f8c8d',
                                    minWidth: '50px',
                                    textAlign: 'right'
                                  }}>
                                    {result.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              
                              {/* Type breakdown */}
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingLeft: '42px' }}>
                                {result.types.thai > 0 && (
                                  <span style={{ 
                                    fontSize: '0.75rem',
                                    background: '#e8f5e9',
                                    color: '#27ae60',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontWeight: '600'
                                  }}>
                                    🇹🇭 ไทย: {result.types.thai}
                                  </span>
                                )}
                                {result.types.hanoi > 0 && (
                                  <span style={{ 
                                    fontSize: '0.75rem',
                                    background: '#fff3e0',
                                    color: '#f39c12',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontWeight: '600'
                                  }}>
                                    🇻🇳 ฮานอย: {result.types.hanoi}
                                  </span>
                                )}
                                {result.types.yeekee > 0 && (
                                  <span style={{ 
                                    fontSize: '0.75rem',
                                    background: '#e3f2fd',
                                    color: '#2196f3',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontWeight: '600'
                                  }}>
                                    🎰 ยี่กี: {result.types.yeekee}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {presetGroups.length > 0 && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#e3f2fd', 
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#1976d2'
          }}>
            💡 <strong>คำแนะนำ:</strong> คลิกที่กลุ่มเลขเพื่อเลือก/ยกเลิก การใช้ในการวิเคราะห์ กลุ่มที่เลือกจะมีกรอบสีเขียวและเครื่องหมาย ✓
          </div>
        )}
      </div>
    </div>
  )
}
