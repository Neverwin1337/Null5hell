export namespace model {
	
	export class Server {
	    ID: number;
	    Type: number;
	    Name: string;
	    IP: string;
	    User: string;
	    PW: string;
	    Comment: string;
	    CreatedAt: number;
	    UpdatedAt: number;
	
	    static createFrom(source: any = {}) {
	        return new Server(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.ID = source["ID"];
	        this.Type = source["Type"];
	        this.Name = source["Name"];
	        this.IP = source["IP"];
	        this.User = source["User"];
	        this.PW = source["PW"];
	        this.Comment = source["Comment"];
	        this.CreatedAt = source["CreatedAt"];
	        this.UpdatedAt = source["UpdatedAt"];
	    }
	}

}

