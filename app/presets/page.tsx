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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#2c3e50' }}>
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
              transition: 'all 0.2s'
            }}
          >
            ← กลับหน้าหลัก
          </Link>
        </div>
        <p style={{ color: '#7f8c8d', fontSize: '1rem' }}>
          จัดการกลุ่มเลขตั้งต้น เช่น เลขอมตะ, เลขตองแท้ เพื่อใช้ในการวิเคราะห์
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
                      marginLeft: '15px',
                      transition: 'all 0.2s'
                    }}
                  >
                    🗑️ ลบ
                  </button>
                </div>
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
