export type AgentStatus = 'Active' | 'Pending' | 'PIN_CHANGE_REQUIRED' | 'Blocked'
export type FloatHealth = 'Healthy' | 'Low' | 'Critical'

// Normalized from GET /api/v1/agents (list) response items — the backend's raw
// field names (firstName/middleName/lastName, currentBalance, commission,
// transactionCount, upper-case status/floatHealth, regionId/regionName,
// districtId/districtName) are mapped onto this shape in fetchAgents/
// fetchAgentDetail. List, Get and Edit(PUT) all return the same full record now.
export interface AgentSummary {
  agentId: string // internal UUID — required by GET/PUT/DELETE/float-topup, NOT agentNumber
  agentNumber: string // display ID shown in the UI
  fullName: string
  phone: string
  email?: string
  gender?: string
  dateOfBirth?: string
  region?: string // display name (regionName)
  regionId?: string // code (regionId) — what the edit form needs to prefill
  district?: string // display name (districtName)
  districtId?: string // code (districtId) — what the edit form needs to prefill
  floatBalance: number
  floatHealth: FloatHealth
  commissionBalance: number
  transactions: number
  status: AgentStatus
}

// GET /api/v1/agents/{agentId} returns the same shape as the list now.
export type AgentDetail = AgentSummary

// What AgentOnboarding's create/edit form hands back to the Agents page.
export interface AgentEditableFields {
  agentId: string
  fullName: string
  phone: string
  email: string
  dateOfBirth: string
  region: string
  district: string
}
