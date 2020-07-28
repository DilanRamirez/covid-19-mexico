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
    center: [-99.133209, 19.3],
    zoom: 10.5,
  });

  const getData = async () => {
    const data = await fetch(url);
    const alcaldias = await fetch(
      "https://datos.cdmx.gob.mx/api/records/1.0/search/?dataset=alcaldias&q=&rows=16&facet=nomgeo&facet=cve_mun&facet=municipio"
    );
    if (data.ok && alcaldias.ok) {
      const mexicoData = await data.json();
      const mexicoAlcaldias = await alcaldias.json();
      // console.log(mexicoData);
      const parsedData = mexicoData.records.map((item) => item.fields);
      const alcaldiasData = mexicoAlcaldias.records.map((item) => item.fields);

      console.log(alcaldiasData);

      const dataTable = parsedData.map((dailyData) => ({
        colonia: dailyData.colonia,
        alcaldia: dailyData.alcaldia,
        total: dailyData.total,
      }));

      // console.log(dataTable);

      const detailData = {
        colonia: parsedData.map((item) => item.colonia),
        alcaldia: parsedData.map((item) => item.alcaldia),
        coords: parsedData.map((item) => item.geo_point_2d),
        polygon: parsedData.map((item) => item.geo_shape),
        total: parsedData.map((item) => item.total),
      };

      const detailDataAlcadias = {
        nombre: alcaldiasData.map((item) => item.nomgeo),
        polygon: alcaldiasData.map((item) => item.geo_shape),
      };

      const coordinates = {
        long: detailData.coords.map((coord) => coord[0]),
        lat: detailData.coords.map((coord) => coord[1]),
      };

      const polygonData = {
        coords: detailData.polygon.map((coord) => coord.coordinates[0]),
      };

      const polygonAlcaldias = {
        coords: detailDataAlcadias.polygon.map((coord) => coord.coordinates[0]),
      };

      console.log(detailDataAlcadias);
      console.log(polygonAlcaldias);
      console.log(polygonAlcaldias.coords.length)

      for (var i=0;i<polygonAlcaldias.coords.length;i++){
        createPolygon([polygonAlcaldias.coords[i]])
      }
      
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

  const createPolygon = (rings) => {
    var polygonFigure = {
      type: "polygon", // autocasts as new Polygon()
      rings: rings,
    };

    var fillSymbol = {
      type: "simple-fill", // autocasts as new SimpleFillSymbol()
      // color: "#eee",
      outline: {
        // autocasts as new SimpleLineSymbol()
        color: "#ff1235",
        width: 1,
      },
    };

    var polygonGraphic = new Graphic({
      geometry: polygonFigure,
      symbol: fillSymbol,
    });

    view.graphics.add(polygonGraphic);
  };

  const getDataChart = async () => {
    //https://datos.cdmx.gob.mx/explore/dataset/personas-hospitalizadas-covid19/api/
    const data = await fetch(
      "https://datos.cdmx.gob.mx/api/records/1.0/search/?dataset=personas-hospitalizadas-covid19&q=&facet=ano&facet=mes"
    );
    if (data.ok) {
      const mexicoData = await data.json();
      console.log(mexicoData);

      const parsedData = mexicoData.records.map((item) => item.fields);
      const parsedDataDetails = {
        camas_intubados_totales: parsedData.map(
          (item) => item.camas_intubados_totales
        ),
        fecha: parsedData.map((item) => item.fecha),
        hospitalizados_totales: parsedData.map(
          (item) => item.hospitalizados_totales
        ),
      };
      console.log(parsedDataDetails);

      lineChart(
        "my-lineChart",
        parsedDataDetails.fecha.map((fecha) => fecha),
        parsedDataDetails.camas_intubados_totales.map((entubados) => entubados),
        parsedDataDetails.hospitalizados_totales.map(
          (hospitalizados) => hospitalizados
        )
      );

      pieChart(
        "my-pieChart",
        parsedDataDetails.camas_intubados_totales[9],
        parsedDataDetails.hospitalizados_totales[9]
      );
    }
  };
  getDataChart();
});

const pieChart = (divID, data1, data2) => {
  var ctx = document.getElementById(divID).getContext("2d");
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Confirmed", "Deaths"],
      datasets: [
        {
          backgroundColor: ["#3e95cdb0", "#8d5ea29e"],
          borderColor: ["#3e95cd", "#8e5ea2"],
          data: [data1, data2],
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Total de Casos",
      },
    },
  });
};

const lineChart = (divID, label, data1, data2) => {
  var ctx = document.getElementById(divID).getContext("2d");
  var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: "line",

    // The data for our dataset
    data: {
      labels: label,
      datasets: [
        {
          label: "Casos Entubados",
          backgroundColor: "#fe8e7fba",
          borderColor: "rgb(255, 99, 132)",
          borderWidth: 2,
          pointBorderWidth: 1,
          data: data1,
        },
        {
          label: "Casos Hospitalizados",
          backgroundColor: "#86c0f8ab",
          borderColor: "#2ca5fd",
          borderWidth: 2,
          pointBorderWidth: 1,
          // fill: false,
          data: data2,
        },
      ],
    },

    // Configuration options go here
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              // Include a dollar sign in the ticks
              callback: function (value, index, values) {
                return value / 1000 + " K";
              },
            },
          },
        ],
        xAxes: [
          {
            ticks: {
              // Include a dollar sign in the ticks
              callback: function (value, index, values) {
                const splitedDate = value.split("-");
                return splitedDate[1] + "-" + splitedDate[2];
              },
            },
          },
        ],
      },
    },
  });
};
