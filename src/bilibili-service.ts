import axios from 'axios';

/**
 * Service for interacting with Bilibili API
 */
export class BilibiliService {
  /**
   * Fetches follower count for a given username
   * @param username Bilibili username
   * @returns The follower count or error message
   */
  public async getFollowerCount(username: string): Promise<{
    success: boolean;
    followerCount?: number;
    error?: string;
  }> {
    try {
      if (!username) {
        return { success: false, error: 'Username is required' };
      }

      // First search for the user to get their ID
      const searchResponse = await axios.get(`https://api.bilibili.com/x/web-interface/search/type`, {
        params: {
          search_type: 'bili_user',
          keyword: username
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (searchResponse.data.code !== 0) {
        return { 
          success: false, 
          error: `Bilibili API Error: ${searchResponse.data.message || 'Unknown error'}` 
        };
      }

      const results = searchResponse.data.data.result;
      if (!results || results.length === 0) {
        return { success: false, error: 'User not found' };
      }

      // Get the first user result
      const userId = results[0].mid;

      // Fetch user info to get follower count
      const userInfoResponse = await axios.get(`https://api.bilibili.com/x/relation/stat`, {
        params: { vmid: userId },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (userInfoResponse.data.code !== 0) {
        return { 
          success: false, 
          error: `Bilibili API Error: ${userInfoResponse.data.message || 'Unknown error'}` 
        };
      }

      const followerCount = userInfoResponse.data.data.follower;
      return { success: true, followerCount };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to fetch data: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
} 