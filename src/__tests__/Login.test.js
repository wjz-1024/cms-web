import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Login from '../views/Login.vue'

// Mock the API module
vi.mock('../api', () => ({
  login: vi.fn()
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock Element Plus message
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('Login Component', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should render login form', () => {
    wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.login-container').exists()).toBe(true)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
  })

  it('should show validation error when username is empty', async () => {
    wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    })

    // Click login without filling form
    await wrapper.find('button[type="submit"]').trigger('click')
    await flushPromises()

    // Should show validation error
    expect(wrapper.html()).toContain('请输入用户名')
  })

  it('should show validation error when password is empty', async () => {
    wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    })

    // Fill username only
    await wrapper.find('input[type="text"]').setValue('admin')
    await wrapper.find('button[type="submit"]').trigger('click')
    await flushPromises()

    // Should show validation error
    expect(wrapper.html()).toContain('请输入密码')
  })

  it('should call login API with correct credentials', async () => {
    const { login } = await import('../api')
    login.mockResolvedValue({
      data: {
        token: 'test-token',
        user: {
          id: 1,
          username: 'admin',
          realName: '管理员'
        }
      }
    })

    wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    })

    // Fill form
    await wrapper.find('input[type="text"]').setValue('admin')
    await wrapper.find('input[type="password"]').setValue('admin123')
    await wrapper.find('button[type="submit"]').trigger('click')
    await flushPromises()

    expect(login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'admin123'
    })
  })

  it('should handle login failure', async () => {
    const { login } = await import('../api')
    login.mockRejectedValue(new Error('用户名或密码错误'))

    wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.find('input[type="text"]').setValue('admin')
    await wrapper.find('input[type="password"]').setValue('wrong')
    await wrapper.find('button[type="submit"]').trigger('click')
    await flushPromises()

    expect(login).toHaveBeenCalled()
  })

  it('should handle very long username (boundary test)', async () => {
    const longUsername = 'a'.repeat(100)

    wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.find('input[type="text"]').setValue(longUsername)
    await wrapper.find('input[type="password"]').setValue('test123')

    const inputValue = wrapper.find('input[type="text"]').element.value
    expect(inputValue).toBe(longUsername)
  })

  it('should handle special characters in password', async () => {
    const specialPassword = 'Test@123!@#$%^&*()'

    wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.find('input[type="password"]').setValue(specialPassword)

    const inputValue = wrapper.find('input[type="password"]').element.value
    expect(inputValue).toBe(specialPassword)
  })

  it('should show loading state during login', async () => {
    const { login } = await import('../api')
    login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    wrapper = mount(Login, {
      global: {
        plugins: [pinia]
      }
    })

    await wrapper.find('input[type="text"]').setValue('admin')
    await wrapper.find('input[type="password"]').setValue('admin123')
    await wrapper.find('button[type="submit"]').trigger('click')

    // Should show loading state immediately
    expect(wrapper.find('button[type="submit"]').attributes('loading')).toBeDefined()
  })
})
