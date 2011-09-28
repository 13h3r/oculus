package ru.oculus.database.resources;

import java.io.IOException;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.xml.bind.JAXBException;

import org.apache.commons.lang3.Validate;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;

import com.sun.jersey.spi.resource.Singleton;

import ru.oculus.database.model.Sid;
import ru.oculus.database.service.scheme.SchemeInfo;
import ru.oculus.database.service.scheme.SchemeService;
import ru.oculus.database.service.sid.SidService;

@Path("/sid/{host}/{sid}/scheme")
@Singleton
@Produces(MediaType.APPLICATION_JSON)
public class SchemeResource {

    @Autowired
    private SchemeService schemeService;

    @Autowired
    private SidService sidService;

    @GET
    public JSONArray getAll(
            @PathParam(value = "host") String host,
            @PathParam(value = "sid") String sidName,
            @DefaultValue("0")  @QueryParam(value = "minSize") String minSizeGbString
            ) throws JAXBException, IOException, JSONException {
        Validate.notNull(host);
        Validate.notNull(sidName);

        Sid sid = sidService.getSid(host,  sidName);
        Validate.notNull(sid);

        double minSizeGb = Double.parseDouble(minSizeGbString);
        JSONArray result = new JSONArray();
        for (SchemeInfo walker : schemeService.getAllSchemes(sid)) {
            if (walker.getSize().doubleValue() > minSizeGb) {
                JSONObject obj = new JSONObject();
                obj.put("connectionCount", walker.getConnectionCount());
                obj.put("name", walker.getName());
                obj.put("size", walker.getSize());
                result.put(obj);
            }
        }

        return result;
    }

}
