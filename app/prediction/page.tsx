'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface LotteryEntry {
  id: string
  number: string
  digitLength: number
  type: 'thai' | 'hanoi' | 'yeekee'
  date: string
}

interface PredictionResult {
  number: string
  frequency: number
  percentage: number
  lastSeen: string
}

export default function PredictionPage() {
  const [predictionDays, setPredictionDays] = useState<1 | 3 | 7>(1)
  const [lotteryType, setLotteryType] = useState<'thai' | 'hanoi' | 'yeekee'>('thai')
  const [digitLength, setDigitLength] = useState<3 | 4>(3)
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const generatePredictions = async (page: number = 1) => {
    setIsLoading(true)
    try {
      // Call filter API with pagination
      const response = await fetch(
        `/api/lottery/filter?type=${lotteryType}&digitLength=${digitLength}&days=${predictionDays}&page=${page}&limit=${pageSize}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch lottery entries')
      }

      const data = await response.json()
      const entries: LotteryEntry[] = data.data || []

      if (entries.length === 0) {
        setPredictions([])
        setTotalPages(1)
        setCurrentPage(page)
        return
      }

      // Count frequency
      const frequencyMap: { [key: string]: { count: number; lastSeen: string } } = {}
      entries.forEach(entry => {
        if (!frequencyMap[entry.number]) {
          frequencyMap[entry.number] = { count: 0, lastSeen: '' }
        }
        frequencyMap[entry.number].count++
        frequencyMap[entry.number].lastSeen = entry.date
      })

      // Calculate total
      const total = entries.length

      // Create predictions sorted by frequency
      const results: PredictionResult[] = Object.entries(frequencyMap)
        .map(([number, data]) => ({
          number,
          frequency: data.count,
          percentage: total > 0 ? (data.count / total) * 100 : 0,
          lastSeen: data.lastSeen
        }))
        .sort((a, b) => b.frequency - a.frequency)

      setPredictions(results)
      setTotalPages(data.pagination.totalPages)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error generating predictions:', error)
      setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    generatePredictions()
  }, [predictionDays, lotteryType, digitLength])

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'thai':
        return '🇹🇭 หวยไทย'
      case 'hanoi':
        return '🇻🇳 หวยฮานอย'
      case 'yeekee':
        return '🎰 หวยยี่กี'
      default:
        return type
    }
  }

  const getTypeColor = (type: string): { bg: string; text: string; border: string } => {
    switch (type) {
      case 'thai':
        return { bg: '#e8f5e9', text: '#27ae60', border: '#27ae60' }
      case 'hanoi':
        return { bg: '#fff3e0', text: '#f39c12', border: '#f39c12' }
      case 'yeekee':
        return { bg: '#e3f2fd', text: '#2196f3', border: '#2196f3' }
      default:
        return { bg: '#f5f5f5', text: '#333', border: '#ddd' }
    }
  }

  const typeColor = getTypeColor(lotteryType)

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
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
            🔮 ทำนายหวยล่วงหน้า
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
          วิเคราะห์เลขที่ออกบ่อยในช่วงเวลาที่กำหนด เพื่อทำนายเลขที่น่าจะออกในอนาคต
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#2c3e50' }}>
          ⚙️ ตั้งค่าการทำนาย
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {/* Lottery Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e' }}>
              ประเภทหวย
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(['thai', 'hanoi', 'yeekee'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setLotteryType(type)}
                  style={{
                    flex: '1 1 calc(33.333% - 7px)',
                    minWidth: '80px',
                    padding: '10px 8px',
                    background: lotteryType === type ? getTypeColor(type).bg : '#f5f5f5',
                    color: lotteryType === type ? getTypeColor(type).text : '#666',
                    border: `2px solid ${lotteryType === type ? getTypeColor(type).border : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    fontSize: 'clamp(0.8rem, 2vw, 0.95rem)'
                  }}
                >
                  {getTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Digit Length */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e' }}>
              จำนวนหลัก
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[3, 4].map(digit => (
                <button
                  key={digit}
                  onClick={() => setDigitLength(digit as 3 | 4)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: digitLength === digit ? '#3498db' : '#f5f5f5',
                    color: digitLength === digit ? 'white' : '#666',
                    border: `2px solid ${digitLength === digit ? '#3498db' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  {digit} หลัก
                </button>
              ))}
            </div>
          </div>

          {/* Prediction Days */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#34495e' }}>
              ช่วงเวลา
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[1, 3, 7].map(days => (
                <button
                  key={days}
                  onClick={() => setPredictionDays(days as 1 | 3 | 7)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: predictionDays === days ? '#27ae60' : '#f5f5f5',
                    color: predictionDays === days ? 'white' : '#666',
                    border: `2px solid ${predictionDays === days ? '#27ae60' : '#ddd'}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                >
                  {days} วัน
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="card">
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#2c3e50' }}>
          📊 ผลการทำนาย ({getTypeLabel(lotteryType)} - {digitLength} หลัก - {predictionDays} วัน)
        </h2>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '1.2rem' }}>⏳ กำลังวิเคราะห์...</div>
          </div>
        ) : predictions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📭</div>
            <div style={{ fontSize: '1.2rem' }}>ไม่พบข้อมูลในช่วงเวลานี้</div>
            <div style={{ fontSize: '0.9rem', marginTop: '5px' }}>ลองเปลี่ยนช่วงเวลาหรือประเภทหวย</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {predictions.map((pred, idx) => (
              <div
                key={idx}
                style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: `2px solid ${typeColor.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flex: 1,
                  minWidth: 0
                }}>
                  <div style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    color: '#7f8c8d',
                    fontWeight: '600',
                    minWidth: '30px'
                  }}>
                    #{idx + 1}
                  </div>
                  <div style={{
                    fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
                    fontWeight: '700',
                    color: typeColor.text,
                    fontFamily: 'monospace',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {pred.number}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                    <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: '#7f8c8d' }}>
                      ออก {pred.frequency} ครั้ง
                    </div>
                    <div style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.8rem)', color: '#95a5a6' }}>
                      ล่าสุด: {pred.lastSeen}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'auto' }}>
                  <div style={{
                    fontSize: 'clamp(0.9rem, 3vw, 1.2rem)',
                    fontWeight: '700',
                    color: typeColor.text,
                    minWidth: '45px',
                    textAlign: 'right'
                  }}>
                    {pred.percentage.toFixed(1)}%
                  </div>
                  <div style={{
                    width: 'clamp(60px, 20vw, 100px)',
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pred.percentage}%`,
                      background: typeColor.text,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {predictions.length > 0 && (
          <>
            {/* Pagination */}
            <div style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => generatePredictions(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  background: currentPage === 1 ? '#ecf0f1' : '#3498db',
                  color: currentPage === 1 ? '#95a5a6' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  fontSize: 'clamp(0.75rem, 2vw, 0.9rem)'
                }}
              >
                ← ก่อนหน้า
              </button>

              <div style={{
                display: 'flex',
                gap: '3px',
                alignItems: 'center',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = currentPage > 3 ? currentPage - 2 + i : i + 1
                  if (pageNum > totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => generatePredictions(pageNum)}
                      style={{
                        padding: '6px 10px',
                        background: pageNum === currentPage ? '#3498db' : '#ecf0f1',
                        color: pageNum === currentPage ? 'white' : '#333',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: pageNum === currentPage ? '700' : '600',
                        transition: 'all 0.2s',
                        fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                        minWidth: '32px'
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => generatePredictions(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  background: currentPage === totalPages ? '#ecf0f1' : '#3498db',
                  color: currentPage === totalPages ? '#95a5a6' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  fontSize: 'clamp(0.75rem, 2vw, 0.9rem)'
                }}
              >
                ถัดไป →
              </button>

              <span style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                color: '#7f8c8d',
                fontWeight: '600',
                marginLeft: '5px'
              }}>
                หน้า {currentPage} / {totalPages}
              </span>
            </div>

            {/* Info */}
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: '#e3f2fd',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#1976d2'
            }}>
              💡 <strong>วิธีอ่านผล:</strong> เลขที่มีเปอร์เซ็นต์สูงแสดงว่าออกบ่อยในช่วง {predictionDays} วันที่ผ่านมา อาจจะออกอีกในอนาคต
            </div>
          </>
        )}
      </div>
    </div>
  )
}
