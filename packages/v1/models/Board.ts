import { Channel as SocketIoChannel } from 'laravel-echo/dist/channel';
import Resource from '../endpoint/JsonResponse';
import PaginationResponse from '../endpoint/pagination/PaginationResponse';
import v1 from '../index';
import Icon from '../interfaces/Icon';
import { Board as IBoard, BoardUser, Channel } from '../resources/boards';
import Announcement from '../resources/boards/interfaces/Announcement';
import { BoardChatSettings } from '../resources/boards/interfaces/Board';
import ShardRole from '../resources/boards/interfaces/ShardRole';
import { default as Content, default as IContent } from './Content';
import Model from './default/ResourceModel';

const BOARD_UPDATE = 'Board.UpdateBoard';
/**
 * ## The Object representation for a Board.
 * ```typescript
 * const board = api.boards.get('000');
 *
 * console.log(board.name); // Gives you the name of the Board.
 *
 * board.name = 'ChangedName';
 * board.settings = {
 *     chat: {
 *          enabled: false;
 *     }
 * };
 *
 * board.save(); // Persists changes to the server;
 * ```
 */
export default class Board extends Model<IBoard> implements IBoard {
    id!: string;
    name!: string;
    color_scheme!: string;
    channel!: Channel;
    owner!: boolean;
    owner_id!: string;
    company_id!: string;
    icon?: Icon | undefined;
    latest_content!: string;
    roles!: ShardRole[];
    settings!: BoardChatSettings;
    slug!: string;
    uri!: string;
    url!: string;
    user_role!: ShardRole;
    created_at!: string;
    updated_at!: string;

    private socketChannel: SocketIoChannel;

    private channel_prefix = 'board.';

    constructor(resource: IBoard) {
        super(resource, {
            endpoints: v1.getInstance().boards.baseUri + '/' + resource.id,
        });
        this.socketChannel = this.api.socket.join(
            this.channel_prefix + resource.id,
        );
    }

    /**
     * #### Usage
     *
     * ```ts
     * const board = api.boards.get('000');
     * board.on('update', (board) => {
     *  console.log('Board ' + board.name + ' has been updated by the backend');
     * });
     * // This line starts the listining process
     * board.listenToUpdates();
     * ```
     */
    listenToUpdates = () => {
        this.socketChannel.listen(BOARD_UPDATE, (e: { board: Board }) =>
            this.onBoardUpdate(e.board),
        );
    };

    private onBoardUpdate = (board: IBoard): void => {
        this.batchUpdate(board);
    };

    public static collection(boards: IBoard[]): Board[] {
        return boards.map((b) => new Board(b));
    }

    public async getContents(): Promise<Content[]> {
        const response = await this.api.http.get<Resource<IContent[]>>(
            this._endpoints.get + '/contents',
        );
        return Content.collection(response.data.data);
    }

    /**
     * Queries all users for the current board
     *
     * @returns All users on the board
     */
    getUsers = async (): Promise<BoardUser[]> => {
        const response = await this.api.http.get<Resource<BoardUser[]>>(
            this._endpoints.get + '/users',
        );
        return response.data.data;
    };

    getInvitations = async (): Promise<BoardUser[]> => {
        const response = await this.api.http.get<Resource<BoardUser[]>>(
            this._endpoints.get + '/users',
        );
        return response.data.data;
    };

    getAnnouncements = async (
        chunk = 1,
    ): Promise<PaginationResponse<Announcement[]>> => {
        const response = await this.api.http.get<
            PaginationResponse<Announcement[]>
        >(this._endpoints.get + '/announcements', {
            params: {
                page: chunk,
            },
        });
        return response.data;
    };
}
