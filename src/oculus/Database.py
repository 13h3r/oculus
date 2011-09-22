import time
import pickle
import cx_Oracle
import sys

stubmode = 0

class DatabaseStorage:
    def __init__(self):
        if stubmode == 1:
            self.databases = [
                DatabaseInfo("mox04.sibirenergo-billing.ru", "qaasr", "SYS", "*"),
                DatabaseInfo("mox05.sibirenergo-billing.ru", "prodasr", "SYS", "*"),
            ]
        else:
            f = open("oculus/databases.pickle", 'rb+');
            self.databases = pickle.load(f);
            f.close();
        
    def gather(self):
        return self.databases;

    def getDbInfo(self, host, sid):
        for db in self.databases:
            if db.host == host and db.sid == sid:
                return db
        return None

class DatabaseInfo(object):

    def __init__(self, host, sid, sys_login, sys_password):
        self.host = host
        self.sid = sid
        self.sys_login = sys_login
        self.sys_password = sys_password
        
    def gatherSchemas(self):
        if stubmode == 1:
            time.sleep(1);
            self.schemes = [
                SchemeInfo('DEV_RENAT', '32GB', 4),
                SchemeInfo('DEV_ROMANCHUK', '31GB', 6 ),
                SchemeInfo('TRUNK_STABLE_QA', '30GB', 0),
            ]
        else: 
            connection = cx_Oracle.connect(self.sys_login, self.sys_password, cx_Oracle.makedsn(self.host, 1521, self.sid), cx_Oracle.SYSDBA)        
            cursor = connection.cursor()
            cursor.execute('''
    select owner, ''||trunc(sum(bytes)/1024/1024/1024, 1), nvl(c_count, 0)
    from dba_segments dbs
    left outer join ( select count(*) as c_count, s.username as username from v$session s group by s.username) s on s.username = dbs.owner
    group by owner, c_count
    having sum(bytes) > 5000000000
    order by sum(bytes) desc
            ''')
            self.schemes = []
            for record in cursor.fetchall():
                self.schemes.append(SchemeInfo(record[0], record[1], record[2]))
            cursor.close()
            connection.close()
        return self.schemes
    
    def gatherTablespaces(self):
        if stubmode == 1:
            time.sleep(1);
            self.schemes = [
                TablespaceInfo('ФВА', 1, 4),
                TablespaceInfo('ААА', 44, 6 ),
                TablespaceInfo('Е1', 12312, 0),
            ]
        else: 
            connection = cx_Oracle.connect(self.sys_login, self.sys_password, cx_Oracle.makedsn(self.host, 1521, self.sid), cx_Oracle.SYSDBA)        
            cursor = connection.cursor()
            cursor.execute('''
            select f.tablespace_name as name, trunc(sum(u.bytes)/1024/1024/1024, 0) total, trunc(sum(f.bytes)/1024/1024/1024,0) as free 
from  ( select tablespace_name , sum(bytes) as bytes from sys.dba_free_space group by tablespace_name)  f
inner join ( select tablespace_name , sum(bytes) as bytes from sys.dba_data_files group by tablespace_name) u on u.tablespace_name = f.tablespace_name
where f.tablespace_name = 'ASR_DATA'
group by f.tablespace_name
            ''')
            self.schemes = []
            for record in cursor.fetchall():
                self.schemes.append(TablespaceInfo(record[0], record[1], record[2]))
            cursor.close()
            connection.close()
        return self.schemes
    
    def drop(self):
      connection = cx_Oracle.connect(self.sys_login, self.sys_password, cx_Oracle.makedsn(self.host, 1521, self.sid), cx_Oracle.SYSDBA)        
      cursor = connection.cursor()
      cursor.execute("select 1 / 0 from dual")
     
      
class SchemeInfo:
    
    def __init__(self, name, size, connection_count):
        self.name = name
        self.size = size
        self.connection_count = connection_count
        
class TablespaceInfo:
    def __init__(self, name, totalSpace, freeSpace):
        self.name = name
        self.freeSpace = freeSpace
        self.totalSpace = totalSpace
        self.percent = round(100 * (totalSpace - freeSpace) / totalSpace, 2)
        
        
 