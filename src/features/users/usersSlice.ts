import type { RootState } from '@/app/store'
import { selectCurrentUsername } from '@/features/auth/authSlice'
import { createAppSlice } from '@/app/createAppSlice'
import { client } from '@/api/client'

interface User {
  id: string
  name: string
}

const initialState: User[] = []

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
          fulfilled: (state, action) => action.payload,
        },
      ),
    }
  },
})

export default usersSlice.reducer

export const { fetchUsers } = usersSlice.actions

export const selectAllUsers = (state: RootState) => state.users

export const selectUserById = (state: RootState, userId: string | null) =>
  state.users.find((user) => user.id === userId)

export const selectCurrentUser = (state: RootState) => {
  const currentUsername = selectCurrentUsername(state)
  return selectUserById(state, currentUsername)
}
