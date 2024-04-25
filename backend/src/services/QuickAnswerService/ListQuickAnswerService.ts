import { Sequelize,Op } from "sequelize";
import QuickAnswer from "../../models/QuickAnswer";

interface Request {
  searchParam?: string;
  pageNumber?: string;
}

interface Response {
  quickAnswers: QuickAnswer[];
  count: number;
  hasMore: boolean;
}

const ListQuickAnswerService = async ({
  searchParam = "",
  pageNumber = "1"
}: Request): Promise<Response> => {
  const searchQuery = `%${searchParam.toLowerCase().trim()}%`;
 // Using Op.or to combine conditions
 const whereCondition = {
  [Op.or]: [
    {
      shortcut: {
        [Op.like]: Sequelize.fn("lower", searchQuery)
      }
    },
    {
      message: {
        [Op.like]: Sequelize.fn("lower", searchQuery)
      }
    }
  ]
};

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: quickAnswers } = await QuickAnswer.findAndCountAll({
    where: whereCondition,
    distinct : true,
    limit,
    offset,
    order: [["message", "ASC"]]
  });

  const hasMore = count > offset + quickAnswers.length;

  return {
    quickAnswers,
    count,
    hasMore
  };
};

export default ListQuickAnswerService;
