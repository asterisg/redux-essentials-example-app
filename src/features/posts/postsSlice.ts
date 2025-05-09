import { RootState } from '@/app/store'
import { createAppAsyncThunk } from '@/app/withTypes'
import { nanoid } from '@reduxjs/toolkit'
import { client } from '@/api/client'
import { userLoggedOut } from '../auth/authSlice'
import { createAppSlice } from '@/app/createAppSlice'

export interface Reactions {
  thumbsUp: number
  tada: number
  heart: number
  rocket: number
  eyes: number
}

export type ReactionName = keyof Reactions
export interface Post {
  id: string
  title: string
  content: string
  user: string
  date: string
  reactions: Reactions
}

type PostUpdate = Pick<Post, 'id' | 'title' | 'content'>

const initialReactions: Reactions = {
  thumbsUp: 0,
  tada: 0,
  heart: 0,
  rocket: 0,
  eyes: 0,
}

interface PostsState {
  posts: Post[]
  status: 'idle' | 'pending' | 'succeeded' | 'rejected'
  error: string | null
}

const initialState: PostsState = {
  posts: [],
  status: 'idle',
  error: null,
}

// Create the slice and pass in the initial state
const postsSlice = createAppSlice({
  name: 'posts',
  initialState,
  reducers: (create) => {
    return {
      postAdded: create.preparedReducer(
        (title: string, content: string, userId: string) => {
          return {
            payload: {
              id: nanoid(),
              date: new Date().toISOString(),
              title,
              content,
              user: userId,
              reactions: initialReactions,
            },
          }
        },
        (state, action) => {
          state.posts.push(action.payload)
        },
      ),
      postUpdated: create.reducer<PostUpdate>((state, action) => {
        const { id, title, content } = action.payload
        const existingPost = state.posts.find((post) => post.id === id)
        if (existingPost) {
          existingPost.title = title
          existingPost.content = content
        }
      }),
      reactionAdded: create.reducer<{ postId: string; reaction: ReactionName }>((state, action) => {
        const { postId, reaction } = action.payload
        const existingPost = state.posts.find((post) => post.id === postId)
        if (existingPost) {
          existingPost.reactions[reaction]++
        }
      }),
      fetchPosts: create.asyncThunk(
        // Payload creator function to fetch the data
        async () => {
          const response = await client.get<Post[]>('/fakeApi/posts')
          return response.data
        },
        {
          // Options for `createAsyncThunk`
          options: {
            condition(arg, thunkApi) {
              const { posts } = thunkApi.getState() as RootState
              if (posts.status !== 'idle') {
                return false
              }
            },
          },
          // The case reducers to handle the dispatched actions.
          // Each of these is optional, but must use these names.
          pending: (state, action) => {
            state.status = 'pending'
          },
          fulfilled: (state, action) => {
            state.status = 'succeeded'
            // Add any fetched posts to the array
            state.posts.push(...action.payload)
          },
          rejected: (state, action) => {
            state.status = 'rejected'
            state.error = action.error.message ?? 'Unknown Error'
          },
        },
      ),
    }
  },
  extraReducers: (builder) => {
    builder.addCase(userLoggedOut, (state) => {
      // Clear out the list of posts whenever the user logs out
      return initialState
    })
  },
  selectors: {
    // Note that these selectors are given just the `PostsState`
    // as an argument, not the entire `RootState`
    selectAllPosts: (state) => state.posts,
    selectPostById: (state, postId: string) => {
      return state.posts.find((post) => post.id === postId)
    },
    selectPostsStatus: (state) => state.status,
    selectPostsError: (state) => state.error,
  },
})

export const { postAdded, postUpdated, reactionAdded, fetchPosts } = postsSlice.actions

export const { selectAllPosts, selectPostById, selectPostsError, selectPostsStatus } = postsSlice.selectors

// Export the generated reducer function
export default postsSlice.reducer
