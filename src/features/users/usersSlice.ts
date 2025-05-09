import type { RootState } from '@/app/store'
import { createEntityAdapter } from '@reduxjs/toolkit'
import { selectCurrentUsername } from '@/features/auth/authSlice'
import { createAppSlice } from '@/app/createAppSlice'
import { client } from '@/api/client'

interface User {
  id: string
  name: string
}

const usersAdapter = createEntityAdapter<User>()

const initialState = usersAdapter.getInitialState()

const usersSlice = createAppSlice({
  name: 'users',
  initialState,
  reducers: (create) => {
    return {
      fetchUsers: create.asyncThunk(
        async () => {
          const response = await client.get<User[]>('/fakeApi/users')
          return response.data
        },
        {
          fulfilled: usersAdapter.setAll,
        },
      ),
    }
  },
})

export default usersSlice.reducer

export const { selectAll: selectAllUsers, selectById: selectUserById } = usersAdapter.getSelectors(
  (state: RootState) => state.users,
)

export const { fetchUsers } = usersSlice.actions

export const selectCurrentUser = (state: RootState) => {
  const currentUsername = selectCurrentUsername(state)
  if (!currentUsername) {
    return
  }
  return selectUserById(state, currentUsername)
}
