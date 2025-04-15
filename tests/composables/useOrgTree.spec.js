import { describe, it, expect } from 'vitest'
import { buildTree } from '@/composables/useOrgTree'

describe('buildTree', () => {
  it('creates correct hierarchy and includes required fields', () => {
    const csvData = [
      {
        'Employee Id': 'p_DrnEHzsrxaHOPnwwNDBwy',
        Name: 'Melody Himes',
        'Job Title': 'CEO',
        Email: 'melody.himes@yahoo.com',
        Manager: '',
        Status: 'Active',
        Department: 'Customer Support and Success',
        Location: 'Toronto, Canada',
        Salary: '20000000',
        Photo: 'https://ui-avatars.com/api/?name=0&background=1&color=fff'
      },
      {
        'Employee Id': 'p_cNNDKZRLm2DMkjKXx8YPdo',
        Name: 'Pablo Pitts',
        'Job Title': 'CHRO',
        Email: 'pablo.pitts@hotmail.com',
        Manager: 'p_DrnEHzsrxaHOPnwwNDBwy',
        Status: 'Active',
        Department: 'Business Intelligence',
        Location: 'Paris, France',
        Salary: '157478.1361',
        Photo: 'https://ui-avatars.com/api/?name=0&background=1&color=fff'
      }
    ]

    const root = buildTree(csvData)

    // Check root properties
    expect(root.name).toBe('Melody Himes')
    expect(root.title).toBe('CEO')
    expect(root.salary).toBe(20000000)
    expect(root.email).toBe('melody.himes@yahoo.com')
    expect(root.department).toBe('Customer Support and Success')
    expect(root.location).toBe('Toronto, Canada')
    expect(root.photo).toContain('ui-avatars.com')

    // Check child (Pablo Pitts)
    expect(root._children.length).toBe(1)
    const child = root._children[0]
    expect(child.name).toBe('Pablo Pitts')
    expect(child.title).toBe('CHRO')
    expect(child.department).toBe('Business Intelligence')
  })
})
