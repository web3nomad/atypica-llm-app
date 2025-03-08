interface XHSUserNote {
  id: string;
  title: string;
  desc: string;
  type: string;
  nice_count: number;
  collected_count: number;
  comments_count: number;
  user: {
    nickname: string;
    userid: string;
    images: string;
  };
  images_list: {
    url: string;
    url_size_large: string;
    width: number;
    height: number;
  }[];
}

export interface XHSUserPostsResult {
  notes: XHSUserNote[];
}

function parseXHSUserPosts(data: {
  data: {
    notes: XHSUserNote[];
  };
}): XHSUserPostsResult {
  const notes: XHSUserNote[] = [];
  data.data.notes.forEach((note) => {
    notes.push({
      id: note.id,
      title: note.title,
      desc: note.desc,
      type: note.type,
      nice_count: note.nice_count,
      collected_count: note.collected_count,
      comments_count: note.comments_count,
      user: {
        nickname: note.user.nickname,
        userid: note.user.userid,
        images: note.user.images,
      },
      images_list: note.images_list.map((image) => ({
        url: image.url,
        url_size_large: image.url_size_large,
        width: image.width,
        height: image.height,
      })),
    });
  });
  return {
    notes,
  };
}

export async function xhsUserPosts({ userId }: { userId: string }) {
  try {
    const params = {
      token: process.env.XHS_API_TOKEN!,
      userId,
    };

    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${process.env.XHS_API_BASE_URL}/get-user-note-list/v1?${queryString}`,
    );
    const data = await response.json();
    const result = parseXHSUserPosts(data);
    return result;
  } catch (error) {
    console.error("Error fetching XHS user posts:", error);
    throw error;
  }
}
