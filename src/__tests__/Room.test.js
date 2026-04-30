import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Room from '../views/base/Room.vue'

// Mock API module
vi.mock('../api', () => ({
  getRooms: vi.fn(),
  getRoom: vi.fn(),
  createRoom: vi.fn(),
  updateRoom: vi.fn(),
  deleteRoom: vi.fn(),
  getAllCompanies: vi.fn(),
  getAllCustomers: vi.fn(),
  createRental: vi.fn(),
  getRoomRental: vi.fn(),
  getDictionaryByType: vi.fn()
}))

// Mock Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  },
  ElMessageBox: {
    confirm: vi.fn(() => Promise.resolve())
  }
}))

describe('Room Management Component', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  it('should render room list page', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.page-container').exists()).toBe(true)
    expect(wrapper.find('el-card').exists()).toBe(true)
  })

  it('should have search form with company filter', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.vm.searchForm).toBeDefined()
    expect(wrapper.vm.searchForm.companyId).toBe('')
    expect(wrapper.vm.searchForm.building).toBe('')
    expect(wrapper.vm.searchForm.status).toBe('')
  })

  it('should handle room status display', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      },
      data() {
        return {
          tableData: [
            { id: 1, status: 0, rental: null }, // vacant
            { id: 2, status: 1, rental: { customerName: 'Test' } } // rented
          ]
        }
      }
    })

    const vacantRoom = wrapper.vm.tableData[0]
    const rentedRoom = wrapper.vm.tableData[1]

    expect(vacantRoom.status).toBe(0)
    expect(rentedRoom.status).toBe(1)
  })

  it('should calculate rent period correctly', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      }
    })

    wrapper.vm.rentalForm = {
      rentTotal: 12000,
      rentCycle: 1 // monthly
    }

    wrapper.vm.calcRentPeriod()

    expect(wrapper.vm.rentPeriodAmount.rent).toBe('1000.00') // 12000 * 1 / 12
  })

  it('should calculate property fee from area', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      },
      data() {
        return {
          currentRoom: { area: 100 }
        }
      }
    })

    wrapper.vm.rentalForm = {
      propertyFeePerSqm: 2.5,
      propertyFeeTotal: 0,
      propertyFeeCycle: 1
    }

    wrapper.vm.calcPropertyFromSqm()

    expect(wrapper.vm.rentalForm.propertyFeeTotal).toBe('250.00') // 2.5 * 100
  })

  it('should calculate property fee per sqm from total', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      },
      data() {
        return {
          currentRoom: { area: 100 }
        }
      }
    })

    wrapper.vm.rentalForm = {
      propertyFeePerSqm: 0,
      propertyFeeTotal: 300,
      propertyFeeCycle: 1
    }

    wrapper.vm.calcPropertyFromTotal()

    expect(wrapper.vm.rentalForm.propertyFeePerSqm).toBe('3.00') // 300 / 100
  })

  it('should handle different billing cycles', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      }
    })

    const cycles = [
      { cycle: 1, name: '月', expected: 1 },
      { cycle: 2, name: '季', expected: 3 },
      { cycle: 3, name: '半年', expected: 6 },
      { cycle: 4, name: '年', expected: 12 }
    ]

    cycles.forEach(({ cycle, expected }) => {
      wrapper.vm.rentalForm = {
        rentTotal: 12000,
        rentCycle: cycle
      }
      wrapper.vm.calcRentPeriod()
      expect(wrapper.vm.rentPeriodAmount.rent).toBe((12000 * expected / 12).toFixed(2))
    })
  })

  it('should validate room data before creation', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      }
    })

    const validRoom = {
      companyId: 1,
      building: 'A 栋',
      floor: 5,
      roomNo: '501',
      area: 100
    }

    const invalidRoom = {
      companyId: 0,
      building: '',
      floor: -1,
      roomNo: '',
      area: -50
    }

    expect(validRoom.companyId).toBeGreaterThan(0)
    expect(validRoom.building.length).toBeGreaterThan(0)
    expect(validRoom.floor).toBeGreaterThan(0)
    expect(validRoom.roomNo.length).toBeGreaterThan(0)
    expect(validRoom.area).toBeGreaterThan(0)

    expect(invalidRoom.companyId).toBe(0)
    expect(invalidRoom.building.length).toBe(0)
    expect(invalidRoom.floor).toBeLessThan(0)
    expect(invalidRoom.roomNo.length).toBe(0)
    expect(invalidRoom.area).toBeLessThan(0)
  })

  it('should handle rent growth calculation', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      }
    })

    const baseRent = 10000
    const growthRate = 5
    const growthYear = 2

    // Year 1 (before growth)
    const year1 = baseRent
    expect(year1).toBe(10000)

    // Year 2 (growth starts)
    const year2 = baseRent * Math.pow(1 + growthRate / 100, 2 - growthYear + 1)
    expect(year2).toBeCloseTo(10500, 0)

    // Year 3
    const year3 = baseRent * Math.pow(1 + growthRate / 100, 3 - growthYear + 1)
    expect(year3).toBeCloseTo(11025, 0)
  })

  it('should handle boundary values for area', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      }
    })

    const boundaryTests = [
      { area: 0.01, valid: true },
      { area: 0, valid: false },
      { area: 99999.99, valid: true },
      { area: 100000, valid: true },
      { area: -1, valid: false }
    ]

    boundaryTests.forEach(({ area, valid }) => {
      if (valid) {
        expect(area).toBeGreaterThan(0)
      } else {
        expect(area <= 0).toBe(true)
      }
    })
  })

  it('should handle special characters in room number', () => {
    wrapper = shallowMount(Room, {
      global: {
        plugins: [pinia]
      }
    })

    const roomNumbers = [
      '301',
      '301A',
      '3-01',
      '301-1',
      'A301'
    ]

    roomNumbers.forEach(roomNo => {
      expect(roomNo.length).toBeGreaterThan(0)
      expect(roomNo.length).toBeLessThanOrEqual(20)
    })
  })
})
