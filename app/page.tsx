'use client'

import { useState, KeyboardEvent, useEffect } from 'react'

interface FrequencyEntry {
  [key: string]: number
}

interface SavedData {
  allNumbers: string[]
  frequency: FrequencyEntry
  timestamp: string
}

interface LotteryEntry {
  id: string
  number: string
  type: 'thai' | 'hanoi'
  date: string
  timestamp: number
}

export default function Home() {
  const [inputNumber, setInputNumber] = useState<string>('')
  const [reversedNumbers, setReversedNumbers] = useState<string[]>([])
  const [allNumbers, setAllNumbers] = useState<string[]>([])
  const [frequency, setFrequency] = useState<FrequencyEntry>({})
  const [isLoaded, setIsLoaded] = useState<boolean>(false)
  const [lotteryType, setLotteryType] = useState<'thai' | 'hanoi'>('thai')
  const [lotteryEntries, setLotteryEntries] = useState<LotteryEntry[]>([])

  useEffect(() => {
    const savedData = localStorage.getItem('keyhuayData')
    if (savedData) {
      try {
        const data: SavedData = JSON.parse(savedData)
        setAllNumbers(data.allNumbers)
        setFrequency(data.frequency)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    const savedEntries = localStorage.getItem('lotteryEntries')
    if (savedEntries) {
      try {
        const entries: LotteryEntry[] = JSON.parse(savedEntries)
        setLotteryEntries(entries)
      } catch (error) {
        console.error('Error loading entries:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded && (allNumbers.length > 0 || Object.keys(frequency).length > 0)) {
      const dataToSave: SavedData = {
        allNumbers,
        frequency,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('keyhuayData', JSON.stringify(dataToSave))
    }
  }, [allNumbers, frequency, isLoaded])

  useEffect(() => {
    if (isLoaded && lotteryEntries.length > 0) {
      localStorage.setItem('lotteryEntries', JSON.stringify(lotteryEntries))
    }
  }, [lotteryEntries, isLoaded])

  const generateReversals = (num: string): void => {
    if (num.length !== 4 || !/^\d{4}$/.test(num)) {
      alert('กรุณากรอกเลข 4 ตัว')
      return
    }

    const digits = num.split('')
    const reversals = new Set<string>()

    const permute = (arr: string[], prefix: string = ''): void => {
      if (arr.length === 0) {
        reversals.add(prefix)
        return
      }

      for (let i = 0; i < arr.length; i++) {
        const current = arr[i]
        const remaining = arr.slice(0, i).concat(arr.slice(i + 1))
        permute(remaining, prefix + current)
      }
    }

    permute(digits)

    const reversalArray = Array.from(reversals)
      .sort()

    setReversedNumbers(reversalArray)

    const newAllNumbers = [...allNumbers, ...reversalArray]
    setAllNumbers(newAllNumbers)

    const newFrequency: FrequencyEntry = { ...frequency }
    reversalArray.forEach((number) => {
      newFrequency[number] = (newFrequency[number] || 0) + 1
    })
    setFrequency(newFrequency)

    setInputNumber('')
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      generateReversals(inputNumber)
    }
  }

  const clearAll = (): void => {
    setInputNumber('')
    setReversedNumbers([])
    setAllNumbers([])
    setFrequency({})
    localStorage.removeItem('keyhuayData')
  }

  const saveLotteryEntry = (): void => {
    if (inputNumber.length !== 4 || !/^\d{4}$/.test(inputNumber)) {
      alert('กรุณากรอกเลข 4 ตัว')
      return
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const timeStr = now.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const newEntry: LotteryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      number: inputNumber,
      type: lotteryType,
      date: `${dateStr} ${timeStr}`,
      timestamp: Date.now(),
    }

    setLotteryEntries([newEntry, ...lotteryEntries])
    setInputNumber('')
    alert('✅ บันทึกเลขสำเร็จ')
  }

  const deleteLotteryEntry = (id: string): void => {
    setLotteryEntries(lotteryEntries.filter((entry) => entry.id !== id))
  }

  const getLotteryTypeLabel = (type: 'thai' | 'hanoi'): string => {
    return type === 'thai' ? '🇹🇭 ไทย' : '🇻🇳 ฮานอย'
  }

  const exportToJSON = (): void => {
    const sortedFreq = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])

    const exportData = {
      exportDate: new Date().toISOString(),
      totalEntries: allNumbers.length,
      uniqueNumbers: Object.keys(frequency).length,
      allNumbers,
      frequency,
      analysis: {
        topNumbers: sortedFreq.slice(0, 10).map(([num, count]) => ({
          number: num,
          count,
          percentage: ((count / allNumbers.length) * 100).toFixed(2),
        })),
        statistics: {
          mostFrequent: sortedFreq[0]?.[0] || null,
          mostFrequentCount: sortedFreq[0]?.[1] || 0,
          leastFrequent: sortedFreq[sortedFreq.length - 1]?.[0] || null,
          leastFrequentCount: sortedFreq[sortedFreq.length - 1]?.[1] || 0,
          average: (allNumbers.length / Object.keys(frequency).length).toFixed(2),
        },
      },
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `keyhuay-analysis-${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const importFromJSON = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content)

        if (data.allNumbers && data.frequency) {
          setAllNumbers(data.allNumbers)
          setFrequency(data.frequency)
          alert('✅ นำเข้าข้อมูลสำเร็จ')
        } else {
          alert('❌ รูปแบบไฟล์ไม่ถูกต้อง')
        }
      } catch (error) {
        alert('❌ เกิดข้อผิดพลาดในการอ่านไฟล์')
        console.error('Error importing:', error)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const sortedFrequency = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const totalNumbers = allNumbers.length

  const analyzeSavedEntries = (): { [key: string]: number } => {
    const entryFrequency: { [key: string]: number } = {}
    lotteryEntries.forEach((entry) => {
      entryFrequency[entry.number] = (entryFrequency[entry.number] || 0) + 1
    })
    return entryFrequency
  }

  const savedEntryFrequency = analyzeSavedEntries()
  const sortedSavedFrequency = Object.entries(savedEntryFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const totalSavedEntries = lotteryEntries.length

  return (
    <div className="container">
      <div className="header">
        <h1>🎰 Keyhuay - ระบบคีย์หวย 4 ตัว</h1>
        <p>กรอกเลข 4 ตัว แล้วกลับเลขได้ + วิเคราะห์เลขที่ออกบ่อยสุด</p>
      </div>

      <div className="main-grid">
        <div className="card">
          <h2>📝 กรอกเลข 4 ตัว</h2>
          <div className="input-group">
            <label htmlFor="number">เลข 4 ตัว (เช่น 0561)</label>
            <input
              id="number"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              placeholder="0000"
            />
          </div>
          <div className="input-group">
            <label htmlFor="lottery-type">ประเภทหวย</label>
            <select
              id="lottery-type"
              value={lotteryType}
              onChange={(e) => setLotteryType(e.target.value as 'thai' | 'hanoi')}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            >
              <option value="thai">🇹🇭 ไทย</option>
              <option value="hanoi">🇻🇳 ฮานอย</option>
            </select>
          </div>
          <button className="button" onClick={() => generateReversals(inputNumber)}>
            🔄 กลับเลข
          </button>
          <button className="button" style={{ marginTop: '10px', background: '#f39c12' }} onClick={saveLotteryEntry}>
            💾 บันทึกเลข
          </button>
          <button className="button" style={{ marginTop: '10px', background: '#e74c3c' }} onClick={clearAll}>
            🗑️ ล้างข้อมูล
          </button>
          <button className="button" style={{ marginTop: '10px', background: '#27ae60' }} onClick={exportToJSON}>
            📥 ส่งออก JSON
          </button>
          <div style={{ marginTop: '10px', position: 'relative' }}>
            <input
              type="file"
              accept=".json"
              onChange={importFromJSON}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
            />
            <button className="button" style={{ background: '#3498db', pointerEvents: 'none' }}>
              📤 นำเข้า JSON
            </button>
          </div>

          {reversedNumbers.length > 0 && (
            <div className="results">
              <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                ✅ เลขที่กลับได้ ({reversedNumbers.length} ตัว)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {reversedNumbers.map((num, idx) => (
                  <div key={idx} className="result-item">
                    <span>{num}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2>📊 สถิติการออก</h2>
          {totalNumbers > 0 && (
            <>
              <div className="stat-grid">
                <div className="stat-box">
                  <div className="number">{totalNumbers}</div>
                  <div className="label">ทั้งหมด</div>
                </div>
                <div className="stat-box">
                  <div className="number">{Object.keys(frequency).length}</div>
                  <div className="label">เลขที่ต่างกัน</div>
                </div>
                <div className="stat-box">
                  <div className="number">{sortedFrequency[0]?.[1] || 0}</div>
                  <div className="label">ออกบ่อยสุด</div>
                </div>
                <div className="stat-box">
                  <div className="number">{sortedFrequency[0]?.[0] || '-'}</div>
                  <div className="label">เลขนั้น</div>
                </div>
              </div>

              {sortedFrequency.length > 0 && (
                <>
                  <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                    🏆 Top 10 เลขที่ออกบ่อยสุด
                  </h3>
                  <table className="frequency-table">
                    <thead>
                      <tr>
                        <th>อันดับ</th>
                        <th>เลข</th>
                        <th>ครั้ง</th>
                        <th>ร้อยละ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFrequency.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                          <td className="number">{item[0]}</td>
                          <td className="count">{item[1]}</td>
                          <td className="percentage">
                            {((item[1] / totalNumbers) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {totalNumbers === 0 && (
            <div className="empty-state">
              ยังไม่มีข้อมูล กรุณากรอกเลข 4 ตัวเพื่อเริ่มต้น
            </div>
          )}
        </div>
      </div>

      {totalNumbers > 0 && (
        <div className="card full-width">
          <h2>📈 กราฟแสดงความถี่</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {sortedFrequency.map((item, idx) => {
              const maxCount = sortedFrequency[0][1]
              const percentage = (item[1] / maxCount) * 100
              return (
                <div key={idx}>
                  <div style={{ marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    เลข {item[0]} ({item[1]} ครั้ง)
                  </div>
                  <div className="bar" style={{ width: `${percentage}%` }}>
                    <span className="bar-label">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {lotteryEntries.length > 0 && (
        <>
          <div className="card full-width">
            <h2>📊 วิเคราะห์เลขที่บันทึก - เลขที่ออกบ่อยสุด</h2>
            {sortedSavedFrequency.length > 0 && (
              <>
                <div className="stat-grid">
                  <div className="stat-box">
                    <div className="number">{totalSavedEntries}</div>
                    <div className="label">ทั้งหมด</div>
                  </div>
                  <div className="stat-box">
                    <div className="number">{Object.keys(savedEntryFrequency).length}</div>
                    <div className="label">เลขที่ต่างกัน</div>
                  </div>
                  <div className="stat-box">
                    <div className="number">{sortedSavedFrequency[0]?.[1] || 0}</div>
                    <div className="label">ออกบ่อยสุด</div>
                  </div>
                  <div className="stat-box">
                    <div className="number">{sortedSavedFrequency[0]?.[0] || '-'}</div>
                    <div className="label">เลขนั้น</div>
                  </div>
                </div>

                <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                  🏆 Top 10 เลขที่ออกบ่อยสุดจากบันทึก
                </h3>
                <table className="frequency-table">
                  <thead>
                    <tr>
                      <th>อันดับ</th>
                      <th>เลข</th>
                      <th>ครั้ง</th>
                      <th>ร้อยละ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSavedFrequency.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                        <td className="number">{item[0]}</td>
                        <td className="count">{item[1]}</td>
                        <td className="percentage">
                          {((item[1] / totalSavedEntries) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                  📈 กราฟแสดงความถี่จากบันทึก
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  {sortedSavedFrequency.map((item, idx) => {
                    const maxCount = sortedSavedFrequency[0][1]
                    const percentage = (item[1] / maxCount) * 100
                    return (
                      <div key={idx}>
                        <div style={{ marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                          เลข {item[0]} ({item[1]} ครั้ง)
                        </div>
                        <div className="bar" style={{ width: `${percentage}%` }}>
                          <span className="bar-label">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="card full-width">
            <h2>📋 บันทึกเลขที่บันทึก ({lotteryEntries.length} รายการ)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="frequency-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>ลำดับ</th>
                    <th style={{ textAlign: 'center' }}>เลข</th>
                    <th style={{ textAlign: 'center' }}>ประเภท</th>
                    <th style={{ textAlign: 'center' }}>วันที่และเวลา</th>
                    <th style={{ textAlign: 'center' }}>ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {lotteryEntries.map((entry, idx) => (
                    <tr key={entry.id}>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                      <td className="number" style={{ textAlign: 'center', fontSize: '1.2rem' }}>
                        {entry.number}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getLotteryTypeLabel(entry.type)}
                      </td>
                      <td style={{ textAlign: 'center', color: '#666' }}>
                        {entry.date}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => deleteLotteryEntry(entry.id)}
                          style={{
                            background: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                          }}
                        >
                          ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
