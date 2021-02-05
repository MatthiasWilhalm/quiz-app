class SocketCommunication {

    constructor(type, id, token, data) {
        this.type = type;
        this.data = data;
        this.id = id;
        this.token = token;
    }

    /**
     * @returns Object as sendable string
     */
    getMsg() {
        return JSON.stringify({type: this.type, id: this.id, token: this.token, data: this.data});
    }

    /**
     * 
     * @param {string} s string that has been received via websocket
     */
    set(s) {
        try {
            let e = JSON.parse(s);
            if(e.type!==undefined) {
                this.type = e.type;
                this.data = e.data;
                this.id = e.id;
                this.token = e.token;
            } else {
                throw "undefined object";
            }
        } catch(ex) {
            return false;
        }
        return true;
    }

}

module.exports.SocketCommunication = (type, id, token, data) => {
        return new SocketCommunication(type, id, token, data);
}