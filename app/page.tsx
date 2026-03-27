'use client'

import { useState, KeyboardEvent, useEffect } from 'react'

interface FrequencyEntry {
  [key: string]: number
}

interface LotteryEntry {
  id: string
  number: string
  type: 'thai' | 'hanoi' | 'yeekee'
  digitLength: number
  date: string
  timestamp: number
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export default function Home() {
  const [inputNumber, setInputNumber] = useState<string>('')
  const [reversedNumbers, setReversedNumbers] = useState<string[]>([])
  const [allNumbers, setAllNumbers] = useState<string[]>([])
  const [frequency, setFrequency] = useState<FrequencyEntry>({})
  const [lotteryType, setLotteryType] = useState<'thai' | 'hanoi' | 'yeekee'>('thai')
  const [lotteryEntries, setLotteryEntries] = useState<LotteryEntry[]>([])
  const [allLotteryEntries, setAllLotteryEntries] = useState<LotteryEntry[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [digitLength, setDigitLength] = useState<3 | 4>(4)
  const [analysisTab, setAnalysisTab] = useState<3 | 4>(4)
  const [analysisTypeTab, setAnalysisTypeTab] = useState<'thai' | 'hanoi' | 'yeekee'>('thai')
  const [analysisDateFilter, setAnalysisDateFilter] = useState<string>('all')
  const [entriesPage, setEntriesPage] = useState<number>(1)
  const [totalEntries, setTotalEntries] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(true)
  const ENTRIES_PER_PAGE = 50

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void => {
    const id = Date.now().toString()
    const newToast: Toast = { id, message, type }
    setToasts((prev) => [...prev, newToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  useEffect(() => {
    const fetchLotteryEntries = async (page: number = 1) => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/lottery?page=${page}&limit=${ENTRIES_PER_PAGE}`)
        if (!response.ok) {
          throw new Error('Failed to fetch entries')
        }
        const result = await response.json()
        const entries: LotteryEntry[] = result.data || result
        
        // Save total count from pagination metadata
        if (result.pagination) {
          setTotalEntries(result.pagination.total)
        }
        
        // Only update state if data has changed (smooth update, no flicker)
        setLotteryEntries((prevEntries) => {
          if (JSON.stringify(prevEntries) !== JSON.stringify(entries)) {
            return entries
          }
          return prevEntries
        })
      } catch (error) {
        console.error('Error fetching entries from database:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchAllEntries = async () => {
      setIsLoadingAnalysis(true)
      try {
        const response = await fetch(`/api/lottery?limit=10000`)
        if (!response.ok) {
          throw new Error('Failed to fetch all entries')
        }
        const result = await response.json()
        const entries: LotteryEntry[] = result.data || result
        setAllLotteryEntries(entries)
      } catch (error) {
        console.error('Error fetching all entries:', error)
      } finally {
        setIsLoadingAnalysis(false)
      }
    }

    localStorage.clear()
    
    fetchLotteryEntries(entriesPage)
    fetchAllEntries()
  }, [entriesPage])


  const generateReversals = (num: string): void => {
    if (num.length !== digitLength || !/^\d+$/.test(num)) {
      showToast(`กรุณากรอกเลข ${digitLength} ตัว`, 'warning')
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

  const generate4DigitFrom7 = (num: string): void => {
    if (num.length !== 7 || !/^\d+$/.test(num)) {
      showToast('กรุณากรอกเลข 7 หลัก', 'warning')
      return
    }

    const digits = num.split('')
    const combinations = new Set<string>()

    // Generate all 4-digit combinations from 7 digits
    const getCombinations = (arr: string[], size: number): string[][] => {
      if (size === 0) return [[]]
      if (arr.length === 0) return []
      
      const result: string[][] = []
      const first = arr[0]
      const rest = arr.slice(1)
      
      // Include first element
      const withFirst = getCombinations(rest, size - 1)
      withFirst.forEach(combo => result.push([first, ...combo]))
      
      // Exclude first element
      const withoutFirst = getCombinations(rest, size)
      withoutFirst.forEach(combo => result.push(combo))
      
      return result
    }

    // Generate permutations for each combination
    const permute = (arr: string[], prefix: string = ''): void => {
      if (arr.length === 0) {
        combinations.add(prefix)
        return
      }

      for (let i = 0; i < arr.length; i++) {
        const current = arr[i]
        const remaining = arr.slice(0, i).concat(arr.slice(i + 1))
        permute(remaining, prefix + current)
      }
    }

    const combos = getCombinations(digits, 4)
    combos.forEach(combo => {
      permute(combo)
    })

    const combinationArray = Array.from(combinations).sort()
    setReversedNumbers(combinationArray)

    const newAllNumbers = [...allNumbers, ...combinationArray]
    setAllNumbers(newAllNumbers)

    const newFrequency: FrequencyEntry = { ...frequency }
    combinationArray.forEach((number) => {
      newFrequency[number] = (newFrequency[number] || 0) + 1
    })
    setFrequency(newFrequency)

    setInputNumber('')
    showToast(`✅ สร้างเลข 4 ตัวได้ ${combinationArray.length} เลข`, 'success')
  }

  const clearAll = (): void => {
    setInputNumber('')
    setReversedNumbers([])
    setAllNumbers([])
    setFrequency({})
  }

  const saveLotteryEntry = async (): Promise<void> => {
    if (inputNumber.length !== digitLength || !/^\d+$/.test(inputNumber)) {
      showToast(`กรุณากรอกเลข ${digitLength} ตัว`, 'warning')
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

    const timestamp = Date.now()

    try {
      const response = await fetch('/api/lottery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: inputNumber,
          type: lotteryType,
          digitLength,
          date: `${dateStr} ${timeStr}`,
          timestamp,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save entry')
      }

      const savedEntry = await response.json()

      const newEntry: LotteryEntry = {
        id: savedEntry.id,
        number: inputNumber,
        type: lotteryType,
        digitLength,
        date: `${dateStr} ${timeStr}`,
        timestamp,
      }

      setLotteryEntries([newEntry, ...lotteryEntries])
      setAllLotteryEntries([newEntry, ...allLotteryEntries])
      setInputNumber('')
      showToast('✅ บันทึกเลขสำเร็จ', 'success')
    } catch (error) {
      console.error('Error saving entry:', error)
      showToast('❌ เกิดข้อผิดพลาดในการบันทึก', 'error')
    }
  }

  const deleteLotteryEntry = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/lottery/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete entry')
      }

      setLotteryEntries(lotteryEntries.filter((entry) => entry.id !== id))
      setAllLotteryEntries(allLotteryEntries.filter((entry) => entry.id !== id))
    } catch (error) {
      console.error('Error deleting entry:', error)
      showToast('❌ เกิดข้อผิดพลาดในการลบ', 'error')
    }
  }

  const getLotteryTypeLabel = (type: 'thai' | 'hanoi' | 'yeekee'): string => {
    if (type === 'thai') return '🇹🇭 ไทย'
    if (type === 'hanoi') return '🇻🇳 ฮานอย'
    return '🎲 ยีกี่'
  }

  const sortedFrequency = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const totalNumbers = allNumbers.length

  const getNormalizedNumber = (num: string): string => {
    const digits = num.split('').sort().join('')
    return digits
  }

  const analyzeSavedEntries = (filterByDigitLength?: 3 | 4, filterByType?: 'thai' | 'hanoi' | 'yeekee', filterByDate?: string): { [key: string]: { count: number; examples: string[] } } => {
    const entryFrequency: { [key: string]: { count: number; examples: string[] } } = {}
    allLotteryEntries.forEach((entry) => {
      if (filterByDigitLength && entry.digitLength !== filterByDigitLength) {
        return
      }
      if (filterByType && entry.type !== filterByType) {
        return
      }
      if (filterByDate && filterByDate !== 'all') {
        const entryDate = entry.date.split(' ')[0]
        if (entryDate !== filterByDate) {
          return
        }
      }
      const normalized = getNormalizedNumber(entry.number)
      if (!entryFrequency[normalized]) {
        entryFrequency[normalized] = { count: 0, examples: [] }
      }
      entryFrequency[normalized].count += 1
      if (!entryFrequency[normalized].examples.includes(entry.number)) {
        entryFrequency[normalized].examples.push(entry.number)
      }
    })
    return entryFrequency
  }

  // 3-digit analysis
  const savedEntryFrequency3Digit = analyzeSavedEntries(3, undefined, analysisDateFilter)
  const sortedSavedFrequency3Digit = Object.entries(savedEntryFrequency3Digit)
    .map(([normalized, data]) => [normalized, data.count, data.examples] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const savedEntryFrequency3DigitThai = analyzeSavedEntries(3, 'thai', analysisDateFilter)
  const sortedSavedFrequency3DigitThai = Object.entries(savedEntryFrequency3DigitThai)
    .map(([normalized, data]) => [normalized, data.count, data.examples] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const savedEntryFrequency3DigitHanoi = analyzeSavedEntries(3, 'hanoi', analysisDateFilter)
  const sortedSavedFrequency3DigitHanoi = Object.entries(savedEntryFrequency3DigitHanoi)
    .map(([normalized, data]) => [normalized, data.count, data.examples] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const savedEntryFrequency3DigitYeekee = analyzeSavedEntries(3, 'yeekee', analysisDateFilter)
  const sortedSavedFrequency3DigitYeekee = Object.entries(savedEntryFrequency3DigitYeekee)
    .map(([normalized, data]) => [normalized, data.count, data.examples] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // 4-digit analysis
  const savedEntryFrequency4Digit = analyzeSavedEntries(4, undefined, analysisDateFilter)
  const sortedSavedFrequency4Digit = Object.entries(savedEntryFrequency4Digit)
    .map(([normalized, data]) => [normalized, data.count, data.examples] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const savedEntryFrequency4DigitThai = analyzeSavedEntries(4, 'thai', analysisDateFilter)
  const sortedSavedFrequency4DigitThai = Object.entries(savedEntryFrequency4DigitThai)
    .map(([normalized, data]) => [normalized, data.count, data.examples] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const savedEntryFrequency4DigitHanoi = analyzeSavedEntries(4, 'hanoi', analysisDateFilter)
  const sortedSavedFrequency4DigitHanoi = Object.entries(savedEntryFrequency4DigitHanoi)
    .map(([normalized, data]) => [normalized, data.count, data.examples] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const savedEntryFrequency4DigitYeekee = analyzeSavedEntries(4, 'yeekee', analysisDateFilter)
  const sortedSavedFrequency4DigitYeekee = Object.entries(savedEntryFrequency4DigitYeekee)
    .map(([normalized, data]) => [normalized, data.count, data.examples] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Extract unique dates from lottery entries
  const uniqueDates = Array.from(new Set(allLotteryEntries.map((e) => e.date.split(' ')[0]))).sort().reverse()

  // Filter entries by date if selected
  const dateFilteredEntries = analysisDateFilter === 'all' 
    ? allLotteryEntries 
    : allLotteryEntries.filter((e) => e.date.split(' ')[0] === analysisDateFilter)

  // Totals
  const totalSavedEntries3Digit = dateFilteredEntries.filter((e) => e.digitLength === 3).length
  const totalSavedEntries4Digit = dateFilteredEntries.filter((e) => e.digitLength === 4).length
  const totalSavedEntries3DigitThai = dateFilteredEntries.filter((e) => e.digitLength === 3 && e.type === 'thai').length
  const totalSavedEntries3DigitHanoi = dateFilteredEntries.filter((e) => e.digitLength === 3 && e.type === 'hanoi').length
  const totalSavedEntries3DigitYeekee = dateFilteredEntries.filter((e) => e.digitLength === 3 && e.type === 'yeekee').length
  const totalSavedEntries4DigitThai = dateFilteredEntries.filter((e) => e.digitLength === 4 && e.type === 'thai').length
  const totalSavedEntries4DigitHanoi = dateFilteredEntries.filter((e) => e.digitLength === 4 && e.type === 'hanoi').length
  const totalSavedEntries4DigitYeekee = dateFilteredEntries.filter((e) => e.digitLength === 4 && e.type === 'yeekee').length

  return (
    <div className="container">
      <div className="header">
        <h1>🎰 Keyhuay - ระบบคีย์หวย</h1>
        <p>กรอกเลขแล้ววิเคราะห์เลขที่ออกบ่อยสุด</p>
      </div>

      <div className="main-grid">
        <div className="card">
          <h2>📝 กรอกเลข</h2>
          <div className="input-group">
            <label htmlFor="digit-length">จำนวนตัวเลข</label>
            <select
              id="digit-length"
              value={digitLength}
              onChange={(e) => {
                setDigitLength(parseInt(e.target.value) as 3 | 4)
                setInputNumber('')
                setReversedNumbers([])
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            >
              <option value="3">3 ตัว (เช่น 056)</option>
              <option value="4">4 ตัว (เช่น 0561)</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="number">เลข {digitLength} ตัว</label>
            <input
              id="number"
              type="text"
              inputMode="numeric"
              maxLength={digitLength}
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value.replace(/\D/g, ''))}
              onKeyPress={handleKeyPress}
              placeholder={digitLength === 3 ? '000' : '0000'}
            />
          </div>
          <div className="input-group">
            <label htmlFor="lottery-type">ประเภทหวย</label>
            <select
              id="lottery-type"
              value={lotteryType}
              onChange={(e) => setLotteryType(e.target.value as 'thai' | 'hanoi' | 'yeekee')}
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
              <option value="yeekee">🎲 ยีกี่</option>
            </select>
          </div>
          {/* <button className="button" onClick={() => generateReversals(inputNumber)}>
            🔄 กลับเลข
          </button> */}
          <button className="button" style={{ marginTop: '10px', background: '#f39c12' }} onClick={saveLotteryEntry}>
            💾 บันทึกเลข
          </button>
          <button className="button" style={{ marginTop: '10px', background: '#e74c3c' }} onClick={clearAll}>
            🗑️ ล้างข้อมูล
          </button>

          {reversedNumbers.length > 0 && (
            <div className="results">
              <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                ✅ เลขที่กลับได้ ({reversedNumbers.length} ตัว)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {reversedNumbers.map((num, idx) => (
                  <div key={idx} className="result-item">
                    <span>{num}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card formula-card">
          <h2>🎯 สูตรจับเลข 4 ตัว</h2>
          <p style={{ color: '#555', marginBottom: '15px', fontSize: '0.9rem', fontWeight: '500' }}>
            กรอกเลข 7 หลัก เพื่อสร้างเลข 4 ตัวทั้งหมดที่เป็นไปได้
          </p>
          <div className="input-group">
            <label htmlFor="seven-digit">เลข 7 หลัก (เช่น 0125679)</label>
            <input
              id="seven-digit"
              type="text"
              inputMode="numeric"
              maxLength={7}
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="0125679"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
              }}
            />
          </div>
          <button 
            className="button" 
            style={{ marginTop: '10px', background: '#9b59b6', width: '100%' }} 
            onClick={() => generate4DigitFrom7(inputNumber)}
          >
            🎲 จับเลข 4 ตัว
          </button>
          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>
            จะได้เลข 4 ตัวประมาณ 840 เลข
          </div>
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
            
            {isLoadingAnalysis && (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px', 
                color: '#3498db',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                <div style={{ marginBottom: '10px' }}>⏳ กำลังโหลดข้อมูลสำหรับการวิเคราะห์...</div>
              </div>
            )}

            {!isLoadingAnalysis && (
              <>
                {/* Date filter */}
                <div style={{ marginBottom: '20px' }}>
                  <label htmlFor="date-filter" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                    📅 กรองตามวันที่
                  </label>
                  <select
                    id="date-filter"
                    value={analysisDateFilter}
                    onChange={(e) => setAnalysisDateFilter(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '300px',
                      padding: '10px',
                      fontSize: '1rem',
                      border: '2px solid #3498db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: 'white',
                    }}
                  >
                    <option value="all">ทั้งหมด</option>
                    {uniqueDates.map((date) => (
                      <option key={date} value={date}>
                        {date}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tabs for digit length */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #ddd' }}>
              <button
                onClick={() => setAnalysisTab(3)}
                style={{
                  padding: '10px 20px',
                  background: analysisTab === 3 ? '#3498db' : 'transparent',
                  color: analysisTab === 3 ? 'white' : '#333',
                  border: 'none',
                  borderBottom: analysisTab === 3 ? '3px solid #3498db' : 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: analysisTab === 3 ? '600' : '500',
                }}
              >
                3 ตัว ({totalSavedEntries3Digit})
              </button>
              <button
                onClick={() => setAnalysisTab(4)}
                style={{
                  padding: '10px 20px',
                  background: analysisTab === 4 ? '#3498db' : 'transparent',
                  color: analysisTab === 4 ? 'white' : '#333',
                  border: 'none',
                  borderBottom: analysisTab === 4 ? '3px solid #3498db' : 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: analysisTab === 4 ? '600' : '500',
                }}
              >
                4 ตัว ({totalSavedEntries4Digit})
              </button>
            </div>

            {analysisTab === 3 && (
              <>
                {/* Nested tabs for lottery type */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '15px' }}>
                  <button
                    onClick={() => setAnalysisTypeTab('thai')}
                    style={{
                      padding: '8px 16px',
                      background: analysisTypeTab === 'thai' ? '#27ae60' : 'transparent',
                      color: analysisTypeTab === 'thai' ? 'white' : '#333',
                      border: 'none',
                      borderBottom: analysisTypeTab === 'thai' ? '2px solid #27ae60' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: analysisTypeTab === 'thai' ? '600' : '500',
                    }}
                  >
                    🇹🇭 ไทย ({totalSavedEntries3DigitThai})
                  </button>
                  <button
                    onClick={() => setAnalysisTypeTab('hanoi')}
                    style={{
                      padding: '8px 16px',
                      background: analysisTypeTab === 'hanoi' ? '#e74c3c' : 'transparent',
                      color: analysisTypeTab === 'hanoi' ? 'white' : '#333',
                      border: 'none',
                      borderBottom: analysisTypeTab === 'hanoi' ? '2px solid #e74c3c' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: analysisTypeTab === 'hanoi' ? '600' : '500',
                    }}
                  >
                    🇻🇳 ฮานอย ({totalSavedEntries3DigitHanoi})
                  </button>
                  <button
                    onClick={() => setAnalysisTypeTab('yeekee')}
                    style={{
                      padding: '8px 16px',
                      background: analysisTypeTab === 'yeekee' ? '#9b59b6' : 'transparent',
                      color: analysisTypeTab === 'yeekee' ? 'white' : '#333',
                      border: 'none',
                      borderBottom: analysisTypeTab === 'yeekee' ? '2px solid #9b59b6' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: analysisTypeTab === 'yeekee' ? '600' : '500',
                    }}
                  >
                    🎲 ยีกี่ ({totalSavedEntries3DigitYeekee})
                  </button>
                </div>

                {analysisTypeTab === 'thai' && sortedSavedFrequency3DigitThai.length > 0 && (
                  <>
                    <div className="stat-grid">
                      <div className="stat-box">
                        <div className="number">{totalSavedEntries3DigitThai}</div>
                        <div className="label">ทั้งหมด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{Object.keys(savedEntryFrequency3DigitThai).length}</div>
                        <div className="label">เลขที่ต่างกัน</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency3DigitThai[0]?.[1] || 0}</div>
                        <div className="label">ออกบ่อยสุด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency3DigitThai[0]?.[0] || '-'}</div>
                        <div className="label">เลขนั้น</div>
                      </div>
                    </div>

                    <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                      🏆 Top 10 เลขที่ออกบ่อยสุดจากบันทึก (3 ตัว - ไทย)
                    </h3>
                    <table className="frequency-table">
                      <thead>
                        <tr>
                          <th>อันดับ</th>
                          <th>เลขกลับ</th>
                          <th>ตัวอย่าง</th>
                          <th>ครั้ง</th>
                          <th>ร้อยละ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSavedFrequency3DigitThai.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                            <td className="number" style={{ textAlign: 'center' }}>{item[0]}</td>
                            <td style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                              {(item[2] as string[]).join(', ')}
                            </td>
                            <td className="count" style={{ textAlign: 'center' }}>{item[1]}</td>
                            <td className="percentage" style={{ textAlign: 'center' }}>
                              {((item[1] / totalSavedEntries3DigitThai) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {analysisTypeTab === 'hanoi' && sortedSavedFrequency3DigitHanoi.length > 0 && (
                  <>
                    <div className="stat-grid">
                      <div className="stat-box">
                        <div className="number">{totalSavedEntries3DigitHanoi}</div>
                        <div className="label">ทั้งหมด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{Object.keys(savedEntryFrequency3DigitHanoi).length}</div>
                        <div className="label">เลขที่ต่างกัน</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency3DigitHanoi[0]?.[1] || 0}</div>
                        <div className="label">ออกบ่อยสุด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency3DigitHanoi[0]?.[0] || '-'}</div>
                        <div className="label">เลขนั้น</div>
                      </div>
                    </div>

                    <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                      🏆 Top 10 เลขที่ออกบ่อยสุดจากบันทึก (3 ตัว - ฮานอย)
                    </h3>
                    <table className="frequency-table">
                      <thead>
                        <tr>
                          <th>อันดับ</th>
                          <th>เลขกลับ</th>
                          <th>ตัวอย่าง</th>
                          <th>ครั้ง</th>
                          <th>ร้อยละ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSavedFrequency3DigitHanoi.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                            <td className="number" style={{ textAlign: 'center' }}>{item[0]}</td>
                            <td style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                              {(item[2] as string[]).join(', ')}
                            </td>
                            <td className="count" style={{ textAlign: 'center' }}>{item[1]}</td>
                            <td className="percentage" style={{ textAlign: 'center' }}>
                              {((item[1] / totalSavedEntries3DigitHanoi) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {analysisTypeTab === 'yeekee' && sortedSavedFrequency3DigitYeekee.length > 0 && (
                  <>
                    <div className="stat-grid">
                      <div className="stat-box">
                        <div className="number">{totalSavedEntries3DigitYeekee}</div>
                        <div className="label">ทั้งหมด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{Object.keys(savedEntryFrequency3DigitYeekee).length}</div>
                        <div className="label">เลขที่ต่างกัน</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency3DigitYeekee[0]?.[1] || 0}</div>
                        <div className="label">ออกบ่อยสุด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency3DigitYeekee[0]?.[0] || '-'}</div>
                        <div className="label">เลขนั้น</div>
                      </div>
                    </div>

                    <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                      🏆 Top 10 เลขที่ออกบ่อยสุดจากบันทึก (3 ตัว - ยีกี่)
                    </h3>
                    <table className="frequency-table">
                      <thead>
                        <tr>
                          <th>อันดับ</th>
                          <th>เลขกลับ</th>
                          <th>ตัวอย่าง</th>
                          <th>ครั้ง</th>
                          <th>ร้อยละ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSavedFrequency3DigitYeekee.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                            <td className="number" style={{ textAlign: 'center' }}>{item[0]}</td>
                            <td style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                              {(item[2] as string[]).join(', ')}
                            </td>
                            <td className="count" style={{ textAlign: 'center' }}>{item[1]}</td>
                            <td className="percentage" style={{ textAlign: 'center' }}>
                              {((item[1] / totalSavedEntries3DigitYeekee) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {analysisTypeTab === 'thai' && sortedSavedFrequency3DigitThai.length === 0 && (
                  <div className="empty-state">ยังไม่มีข้อมูล 3 ตัว ไทย</div>
                )}

                {analysisTypeTab === 'hanoi' && sortedSavedFrequency3DigitHanoi.length === 0 && (
                  <div className="empty-state">ยังไม่มีข้อมูล 3 ตัว ฮานอย</div>
                )}

                {analysisTypeTab === 'yeekee' && sortedSavedFrequency3DigitYeekee.length === 0 && (
                  <div className="empty-state">ยังไม่มีข้อมูล 3 ตัว ยีกี่</div>
                )}
              </>
            )}

            {analysisTab === 4 && (
              <>
                {/* Nested tabs for lottery type */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '15px' }}>
                  <button
                    onClick={() => setAnalysisTypeTab('thai')}
                    style={{
                      padding: '8px 16px',
                      background: analysisTypeTab === 'thai' ? '#27ae60' : 'transparent',
                      color: analysisTypeTab === 'thai' ? 'white' : '#333',
                      border: 'none',
                      borderBottom: analysisTypeTab === 'thai' ? '2px solid #27ae60' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: analysisTypeTab === 'thai' ? '600' : '500',
                    }}
                  >
                    🇹🇭 ไทย ({totalSavedEntries4DigitThai})
                  </button>
                  <button
                    onClick={() => setAnalysisTypeTab('hanoi')}
                    style={{
                      padding: '8px 16px',
                      background: analysisTypeTab === 'hanoi' ? '#e74c3c' : 'transparent',
                      color: analysisTypeTab === 'hanoi' ? 'white' : '#333',
                      border: 'none',
                      borderBottom: analysisTypeTab === 'hanoi' ? '2px solid #e74c3c' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: analysisTypeTab === 'hanoi' ? '600' : '500',
                    }}
                  >
                    🇻🇳 ฮานอย ({totalSavedEntries4DigitHanoi})
                  </button>
                  <button
                    onClick={() => setAnalysisTypeTab('yeekee')}
                    style={{
                      padding: '8px 16px',
                      background: analysisTypeTab === 'yeekee' ? '#9b59b6' : 'transparent',
                      color: analysisTypeTab === 'yeekee' ? 'white' : '#333',
                      border: 'none',
                      borderBottom: analysisTypeTab === 'yeekee' ? '2px solid #9b59b6' : 'none',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: analysisTypeTab === 'yeekee' ? '600' : '500',
                    }}
                  >
                    🎲 ยีกี่ ({totalSavedEntries4DigitYeekee})
                  </button>
                </div>

                {analysisTypeTab === 'thai' && sortedSavedFrequency4DigitThai.length > 0 && (
                  <>
                    <div className="stat-grid">
                      <div className="stat-box">
                        <div className="number">{totalSavedEntries4DigitThai}</div>
                        <div className="label">ทั้งหมด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{Object.keys(savedEntryFrequency4DigitThai).length}</div>
                        <div className="label">เลขที่ต่างกัน</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency4DigitThai[0]?.[1] || 0}</div>
                        <div className="label">ออกบ่อยสุด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency4DigitThai[0]?.[0] || '-'}</div>
                        <div className="label">เลขนั้น</div>
                      </div>
                    </div>

                    <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                      🏆 Top 10 เลขที่ออกบ่อยสุดจากบันทึก (4 ตัว - ไทย)
                    </h3>
                    <table className="frequency-table">
                      <thead>
                        <tr>
                          <th>อันดับ</th>
                          <th>เลขกลับ</th>
                          <th>ตัวอย่าง</th>
                          <th>ครั้ง</th>
                          <th>ร้อยละ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSavedFrequency4DigitThai.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                            <td className="number" style={{ textAlign: 'center' }}>{item[0]}</td>
                            <td style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                              {(item[2] as string[]).join(', ')}
                            </td>
                            <td className="count" style={{ textAlign: 'center' }}>{item[1]}</td>
                            <td className="percentage" style={{ textAlign: 'center' }}>
                              {((item[1] / totalSavedEntries4DigitThai) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {analysisTypeTab === 'hanoi' && sortedSavedFrequency4DigitHanoi.length > 0 && (
                  <>
                    <div className="stat-grid">
                      <div className="stat-box">
                        <div className="number">{totalSavedEntries4DigitHanoi}</div>
                        <div className="label">ทั้งหมด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{Object.keys(savedEntryFrequency4DigitHanoi).length}</div>
                        <div className="label">เลขที่ต่างกัน</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency4DigitHanoi[0]?.[1] || 0}</div>
                        <div className="label">ออกบ่อยสุด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency4DigitHanoi[0]?.[0] || '-'}</div>
                        <div className="label">เลขนั้น</div>
                      </div>
                    </div>

                    <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                      🏆 Top 10 เลขที่ออกบ่อยสุดจากบันทึก (4 ตัว - ฮานอย)
                    </h3>
                    <table className="frequency-table">
                      <thead>
                        <tr>
                          <th>อันดับ</th>
                          <th>เลขกลับ</th>
                          <th>ตัวอย่าง</th>
                          <th>ครั้ง</th>
                          <th>ร้อยละ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSavedFrequency4DigitHanoi.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                            <td className="number" style={{ textAlign: 'center' }}>{item[0]}</td>
                            <td style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                              {(item[2] as string[]).join(', ')}
                            </td>
                            <td className="count" style={{ textAlign: 'center' }}>{item[1]}</td>
                            <td className="percentage" style={{ textAlign: 'center' }}>
                              {((item[1] / totalSavedEntries4DigitHanoi) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {analysisTypeTab === 'yeekee' && sortedSavedFrequency4DigitYeekee.length > 0 && (
                  <>
                    <div className="stat-grid">
                      <div className="stat-box">
                        <div className="number">{totalSavedEntries4DigitYeekee}</div>
                        <div className="label">ทั้งหมด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{Object.keys(savedEntryFrequency4DigitYeekee).length}</div>
                        <div className="label">เลขที่ต่างกัน</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency4DigitYeekee[0]?.[1] || 0}</div>
                        <div className="label">ออกบ่อยสุด</div>
                      </div>
                      <div className="stat-box">
                        <div className="number">{sortedSavedFrequency4DigitYeekee[0]?.[0] || '-'}</div>
                        <div className="label">เลขนั้น</div>
                      </div>
                    </div>

                    <h3 style={{ color: '#333', marginBottom: '15px', marginTop: '20px' }}>
                      🏆 Top 10 เลขที่ออกบ่อยสุดจากบันทึก (4 ตัว - ยีกี่)
                    </h3>
                    <table className="frequency-table">
                      <thead>
                        <tr>
                          <th>อันดับ</th>
                          <th>เลขกลับ</th>
                          <th>ตัวอย่าง</th>
                          <th>ครั้ง</th>
                          <th>ร้อยละ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSavedFrequency4DigitYeekee.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', fontWeight: '600' }}>#{idx + 1}</td>
                            <td className="number" style={{ textAlign: 'center' }}>{item[0]}</td>
                            <td style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                              {(item[2] as string[]).join(', ')}
                            </td>
                            <td className="count" style={{ textAlign: 'center' }}>{item[1]}</td>
                            <td className="percentage" style={{ textAlign: 'center' }}>
                              {((item[1] / totalSavedEntries4DigitYeekee) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                {analysisTypeTab === 'thai' && sortedSavedFrequency4DigitThai.length === 0 && (
                  <div className="empty-state">ยังไม่มีข้อมูล 4 ตัว ไทย</div>
                )}

                {analysisTypeTab === 'hanoi' && sortedSavedFrequency4DigitHanoi.length === 0 && (
                  <div className="empty-state">ยังไม่มีข้อมูล 4 ตัว ฮานอย</div>
                )}

                {analysisTypeTab === 'yeekee' && sortedSavedFrequency4DigitYeekee.length === 0 && (
                  <div className="empty-state">ยังไม่มีข้อมูล 4 ตัว ยีกี่</div>
                )}
              </>
            )}

            {analysisTab === 3 && sortedSavedFrequency3Digit.length === 0 && (
              <div className="empty-state">ยังไม่มีข้อมูล 3 ตัว</div>
            )}

            {analysisTab === 4 && sortedSavedFrequency4Digit.length === 0 && (
              <div className="empty-state">ยังไม่มีข้อมูล 4 ตัว</div>
            )}
              </>
            )}
          </div>

          <div className="card full-width">
            <h2>📋 บันทึกเลขที่บันทึก ({totalEntries} รายการ)</h2>
            
            {isLoading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#3498db',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                <div style={{ marginBottom: '10px' }}>⏳ กำลังโหลดข้อมูล...</div>
              </div>
            )}
            
            {!isLoading && (
              <div style={{ overflowX: 'auto' }}>
                <table className="frequency-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center' }}>ลำดับ</th>
                      <th style={{ textAlign: 'center' }}>เลข</th>
                      <th style={{ textAlign: 'center' }}>จำนวนตัว</th>
                      <th style={{ textAlign: 'center' }}>ประเภท</th>
                      <th style={{ textAlign: 'center' }}>วันที่และเวลา</th>
                      <th style={{ textAlign: 'center' }}>ลบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotteryEntries.map((entry, idx) => (
                      <tr key={entry.id}>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>
                          #{(entriesPage - 1) * ENTRIES_PER_PAGE + idx + 1}
                        </td>
                        <td className="number" style={{ textAlign: 'center', fontSize: '1.2rem' }}>
                          {entry.number}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '600', color: '#3498db' }}>
                          {entry.digitLength} ตัว
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
            )}

            {/* Pagination Controls */}
            {!isLoading && totalEntries > ENTRIES_PER_PAGE && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '20px',
                  paddingTop: '15px',
                  borderTop: '1px solid #ddd',
                }}
              >
                <button
                  onClick={() => setEntriesPage((prev) => Math.max(prev - 1, 1))}
                  disabled={entriesPage === 1}
                  style={{
                    padding: '8px 16px',
                    background: entriesPage === 1 ? '#ccc' : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: entriesPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  ← ก่อนหน้า
                </button>

                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', color: '#333' }}>
                    หน้า {entriesPage} จาก{' '}
                    {Math.ceil(totalEntries / ENTRIES_PER_PAGE)}
                  </span>
                </div>

                <button
                  onClick={() =>
                    setEntriesPage((prev) =>
                      Math.min(prev + 1, Math.ceil(totalEntries / ENTRIES_PER_PAGE))
                    )
                  }
                  disabled={entriesPage === Math.ceil(totalEntries / ENTRIES_PER_PAGE)}
                  style={{
                    padding: '8px 16px',
                    background:
                      entriesPage === Math.ceil(totalEntries / ENTRIES_PER_PAGE)
                        ? '#ccc'
                        : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor:
                      entriesPage === Math.ceil(totalEntries / ENTRIES_PER_PAGE)
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  ถัดไป →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Toast Notifications */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '400px',
        }}
      >
        {toasts.map((toast) => {
          const bgColor =
            toast.type === 'success'
              ? '#27ae60'
              : toast.type === 'error'
                ? '#e74c3c'
                : toast.type === 'warning'
                  ? '#f39c12'
                  : '#3498db'
          return (
            <div
              key={toast.id}
              style={{
                background: bgColor,
                color: 'white',
                padding: '12px 16px',
                borderRadius: '6px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontSize: '0.95rem',
                fontWeight: '500',
                animation: 'slideIn 0.3s ease-out',
                wordWrap: 'break-word',
              }}
            >
              {toast.message}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
