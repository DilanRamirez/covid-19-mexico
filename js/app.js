url =
  "https://datos.cdmx.gob.mx/api/records/1.0/search/?dataset=covid-19-sinave-ciudad-de-mexico-a-nivel-colonia&q=&facet=alcaldia&facet=colonia&facet=total";

require(["esri/Map", "esri/views/MapView", "esri/Graphic"], function (
  Map,
  MapView,
  Graphic
) {
  var map = new Map({
    basemap: "dark-gray-vector",
  });

  var view = new MapView({
    container: "viewDiv", // Reference to the DOM node that will contain the view
    map: map, // References the map object created in step 3
    center: [-99.133209, 19.432608],
    zoom: 12,
  });

  const getData = async () => {
    const data = await fetch(url);
    if (data.ok) {
      const mexicoData = await data.json();
      console.log(mexicoData);
      const parsedData = mexicoData.records.map((item) => item.fields);
      const polygon = mexicoData.records.map((item) => item.geo_shape);

      console.log(parsedData);

      const dataTable = parsedData.map((dailyData) => ({
        colonia: dailyData.colonia,
        alcaldia: dailyData.alcaldia,
        total: dailyData.total,
      }));

      console.log(dataTable);

      const detailData = {
        colonia: parsedData.map((item) => item.colonia),
        alcaldia: parsedData.map((item) => item.alcaldia),
        coords: parsedData.map((item) => item.geo_point_2d),
        polygon: parsedData.map((item) => item.geo_shape),
        total: parsedData.map((item) => item.total),
      };

      const coordinates = {
        long: detailData.coords.map((coord) => coord[0]),
        lat: detailData.coords.map((coord) => coord[1]),
      };

      const polygonData = {
        coords: detailData.polygon.map((coord) => coord.coordinates[0]),
      };
      console.log(detailData);

      for (var i = 0; i < coordinates.long.length; i++) {
        var polygonFigure = {
          type: "polygon", // autocasts as new Polygon()
          rings: [polygonData.coords[i]],
        };

        var fillSymbol = {
          type: "simple-fill", // autocasts as new SimpleFillSymbol()
          color: "#ff9799",
          outline: {
            // autocasts as new SimpleLineSymbol()
            color: "#ff1235",
            width: 1,
          },
        };

        var polygonGraphic = new Graphic({
          geometry: polygonFigure,
          symbol: fillSymbol,
          popupTemplate: {
            title: "COVID-19 Ciudad de Mexico a nivel Colonia",
            content: [
              {
                type: "text",
                text: `Hay ${detailData.total[i]} casos en ${detailData.colonia[i]} informacion actualizada semanalmente`,
              },
            ],
          },
        });

        view.graphics.add(polygonGraphic);
      }

      var $table = $("#table");

      $(function () {
        $("#table").bootstrapTable({
          data: dataTable,
        });
      });
    }
  };
  
  getData();
});
