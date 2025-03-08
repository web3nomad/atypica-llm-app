interface XHSNote {
  id: string;
  title: string;
  desc: string;
  type: string;
  liked_count: number;
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

export interface XHSSearchResult {
  notes: XHSNote[];
  total: number;
}

function parseXHSSearchResult(data: {
  data: {
    items: {
      model_type: string;
      note: XHSNote;
    }[];
  };
}): XHSSearchResult {
  const notes: XHSNote[] = [];
  const items = data.data.items.filter((item) => item.model_type === "note");
  items.forEach(({ note }) => {
    notes.push({
      id: note.id,
      title: note.title,
      desc: note.desc,
      type: note.type,
      liked_count: note.liked_count,
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
    total: notes.length,
  };
}

export async function xhsSearch({ keyword }: { keyword: string }) {
  try {
    const params = {
      token: process.env.XHS_API_TOKEN!,
      keyword,
      page: "1",
      sort: "general",
      noteType: "_0",
    };
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(
      `${process.env.XHS_API_BASE_URL}/search-note/v2?${queryString}`,
    );
    const data = await response.json();
    const searchResult = parseXHSSearchResult(data);
    return searchResult;
  } catch (error) {
    console.error("Error fetching XHS feed:", error);
    throw error;
  }
}
